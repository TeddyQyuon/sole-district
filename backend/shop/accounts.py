import uuid
import hashlib
from datetime import timedelta
from django.conf import settings

from django.contrib.auth import authenticate, get_user_model, login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_GET, require_POST

from .models import AccessToken, CustomerProfile, Order
from .security import account_email, consume_token, issue_token, queue_email, rate_limit

User = get_user_model()
ACK = {"message": "If those details match an account or order, an email will arrive shortly."}


def _helpers():
    from .api import _json_body, _error
    return _json_body, _error


def payload(user):
    profile, _ = CustomerProfile.objects.get_or_create(user=user)
    return {"authenticated": True, "user": {"id": user.pk, "email": user.email,
            "name": user.get_full_name(), "email_verified": bool(profile.email_verified_at)}}


@require_GET
def me(request):
    return JsonResponse(payload(request.user) if request.user.is_authenticated else {"authenticated": False})


@require_POST
def register(request):
    body_reader, error = _helpers()
    if not rate_limit(request, "register", 5, 3600):
        return error("Too many sign-up attempts. Try again later.", 429)
    try:
        body = body_reader(request)
        email = str(body.get("email", "")).strip().lower()
        validate_email(email)
        if len(email) > 254:
            raise ValueError("Email is too long.")
        name = str(body.get("name", "")).strip()[:120]
        candidate = User(email=email, username=email[:150], first_name=name.split(" ", 1)[0])
        validate_password(str(body.get("password", "")), candidate)
        with transaction.atomic():
            # Email-based usernames are deterministic hashes: support all valid email lengths,
            # and enforce case-insensitive uniqueness through the username unique constraint.
            username = "customer_" + hashlib.sha256(email.encode()).hexdigest()
            if User.objects.filter(email__iexact=email).exists():
                return error("An account with this email already exists.", 409)
            user = User.objects.create_user(username=username, email=email,
                password=body["password"], first_name=candidate.first_name,
                last_name=name.split(" ", 1)[1] if " " in name else "")
            CustomerProfile.objects.create(user=user)
            account_email(user, "verify")
    except (ValueError, ValidationError) as exc:
        return error(" ".join(exc.messages) if isinstance(exc, ValidationError) else str(exc))
    except IntegrityError:
        return error("An account with this email already exists.", 409)
    old_session = request.session.session_key
    login(request, user)
    if old_session:
        Order.objects.filter(session_key=old_session, user__isnull=True).update(session_key=request.session.session_key)
    return JsonResponse(payload(user), status=201)


@require_POST
def sign_in(request):
    body_reader, error = _helpers()
    try:
        body = body_reader(request)
    except ValueError as exc:
        return error(str(exc))
    email = str(body.get("email", "")).strip().lower()[:254]
    if not rate_limit(request, "login", 10, 900) or not rate_limit(request, "login-account", 10, 900, email):
        return error("Too many sign-in attempts. Try again later.", 429)
    candidate = User.objects.filter(email__iexact=email).first()
    # Always hash a password even for unknown email addresses.
    user = authenticate(request, username=candidate.username if candidate else "unknown_" + uuid.uuid4().hex,
                        password=str(body.get("password", "")))
    if not user:
        return error("Email or password is incorrect.")
    old_session = request.session.session_key
    login(request, user)
    if old_session:
        Order.objects.filter(session_key=old_session, user__isnull=True).update(session_key=request.session.session_key)
    return JsonResponse(payload(user))


@require_POST
def request_email(request):
    body_reader, error = _helpers()
    try:
        body = body_reader(request)
    except ValueError as exc:
        return error(str(exc))
    purpose = body.get("purpose", "reset")
    if purpose not in {"reset", "verify", "order"}:
        return error("Choose a valid email request.")
    email = str(body.get("email", "")).strip().lower()[:254]
    if not rate_limit(request, "email-request", 5, 900) or not rate_limit(request, "email-account", 3, 900, email):
        return error("Too many email requests. Try again later.", 429)
    if purpose == "order":
        order = Order.objects.filter(reference=str(body.get("reference", ""))[:32],
                                     customer_email__iexact=email, paid_at__isnull=False).first()
        if order:
            raw = issue_token("order", order=order)
            queue_email("order-link:" + uuid.uuid4().hex, email, "Your SOLE DISTRICT order link",
                        f"Open order {order.reference} within 30 minutes:\n{settings.FRONTEND_ORIGIN}/orders#token={raw}")
    else:
        user = User.objects.filter(email__iexact=email, is_active=True, is_staff=False).first()
        if user:
            account_email(user, purpose)
    return JsonResponse(ACK, status=202)


@require_POST
@transaction.atomic
def complete_token(request):
    body_reader, error = _helpers()
    if not rate_limit(request, "token", 20, 900):
        return error("Too many attempts. Try again later.", 429)
    try:
        body = body_reader(request)
        purpose = body.get("purpose")
        if purpose not in {"reset", "verify", "order"}:
            return error("This link is invalid.")
        # Validate passwords before consuming a valid link.
        if purpose == "reset":
            candidate = AccessToken.objects.filter(digest=hashlib.sha256(str(body.get("token", "")).encode()).hexdigest(), purpose=purpose).first()
            if candidate:
                validate_password(str(body.get("password", "")), candidate.user)
        token = consume_token(body.get("token"), purpose)
        if not token:
            return error("This link expired or was already used. Request a fresh email.", 400)
        if purpose == "reset":
            token.user.set_password(body["password"])
            token.user.save(update_fields=["password"])
            AccessToken.objects.filter(user=token.user, purpose="reset", used_at__isnull=True).update(used_at=timezone.now())
        elif purpose == "verify":
            profile, _ = CustomerProfile.objects.get_or_create(user=token.user)
            profile.email_verified_at = timezone.now()
            profile.save(update_fields=["email_verified_at"])
            Order.objects.filter(user__isnull=True, customer_email__iexact=token.user.email, paid_at__isnull=False).update(user=token.user)
        else:
            grants = request.session.get("order_grants", {})
            grants[str(token.order.public_id)] = int((timezone.now() + timedelta(minutes=30)).timestamp())
            request.session["order_grants"] = grants
        return JsonResponse({"completed": True, "message": {"reset": "Password reset. Sign in with your new password.", "verify": "Your email is verified.", "order": "Your order is available for 30 minutes."}[purpose]})
    except (ValueError, ValidationError) as exc:
        return error(" ".join(exc.messages) if isinstance(exc, ValidationError) else str(exc))
