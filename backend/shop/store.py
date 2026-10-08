import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST

from .models import StorePolicy, ContactRequest
from .security import queue_email, rate_limit


@require_GET
def policies(request):
    return JsonResponse({"policies": list(StorePolicy.objects.filter(published=True, approved_at__isnull=False).values("slug", "title", "body")),
                         "contact_ready": bool(settings.STORE_SUPPORT_EMAIL)})


@require_POST
def contact(request):
    from .api import _json_body, _error
    if not settings.STORE_SUPPORT_EMAIL:
        return _error("Customer support is being configured. Please check store information for updates.", 503)
    if not rate_limit(request, "contact", 3, 3600):
        return _error("Too many enquiries. Please try again later.", 429)
    try:
        body = _json_body(request)
        email = str(body.get("email", "")).strip()[:254]
        validate_email(email)
        subject = str(body.get("subject", "")).strip()[:160]
        message = str(body.get("message", "")).strip()[:4000]
        if not subject or len(message) < 10:
            return _error("Please include a subject and a message of at least 10 characters.")
        row = ContactRequest.objects.create(email=email, subject=subject, message=message)
        queue_email(f"contact:{row.reference}", settings.STORE_SUPPORT_EMAIL,
                    f"SOLE DISTRICT enquiry {row.reference}", f"From: {email}\nSubject: {subject}\n\n{message}")
        return JsonResponse({"reference": str(row.reference), "message": "Your enquiry is recorded for the store team."}, status=201)
    except (ValueError, ValidationError):
        return _error("Enter a valid email, subject and message.")
