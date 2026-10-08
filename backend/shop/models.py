import uuid
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    STATUS_CHOICES = [("draft", "Draft"), ("active", "Active"), ("archived", "Archived")]

    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True)
    colour = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    details = models.TextField(blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    image_alt = models.CharField(max_length=240, blank=True)
    price_cents = models.PositiveIntegerField()
    cost_cents = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="draft")
    is_illustrative = models.BooleanField(default=True)
    sourcing_status = models.CharField(max_length=24, default="not_reviewed")
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-featured", "-created_at", "name"]
        indexes = [
            models.Index(fields=["status", "category"]),
            models.Index(fields=["brand", "status"]),
        ]

    def __str__(self):
        return f"{self.brand.name} {self.name}"

    @property
    def sellable(self):
        return self.status == "active" and not self.is_illustrative and self.sourcing_status == "verified"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image_url = models.URLField(max_length=500)
    alt_text = models.CharField(max_length=240)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ["sort_order", "id"]


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    sku = models.CharField(max_length=64, unique=True)
    size = models.CharField(max_length=32)
    size_system = models.CharField(max_length=16, default="UK")
    colour = models.CharField(max_length=100, blank=True)
    price_cents = models.PositiveIntegerField(null=True, blank=True)
    cost_cents = models.PositiveIntegerField(null=True, blank=True)
    stock_on_hand = models.PositiveIntegerField(default=0)
    reserved_stock = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveSmallIntegerField(default=3)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["product__name", "size"]
        constraints = [
            models.UniqueConstraint(fields=["product", "size", "colour"], name="uniq_product_size_colour"),
            models.CheckConstraint(condition=Q(reserved_stock__lte=models.F("stock_on_hand")), name="reserved_lte_stock"),
        ]
        indexes = [models.Index(fields=["sku"]), models.Index(fields=["active", "stock_on_hand"])]

    def __str__(self):
        return f"{self.product} · {self.size}"

    @property
    def available(self):
        return max(0, self.stock_on_hand - self.reserved_stock)

    @property
    def effective_price_cents(self):
        return self.price_cents if self.price_cents is not None else self.product.price_cents

    @property
    def effective_cost_cents(self):
        return self.cost_cents if self.cost_cents is not None else self.product.cost_cents


class InventoryMovement(models.Model):
    TYPE_CHOICES = [
        ("received", "Received"),
        ("adjustment", "Adjustment"),
        ("sale", "Sale"),
        ("return", "Return"),
    ]
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="movements")
    movement_type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    quantity_change = models.IntegerField()
    reason = models.CharField(max_length=240)
    order = models.ForeignKey("Order", null=True, blank=True, on_delete=models.SET_NULL, related_name="inventory_movements")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["variant", "-created_at"])]


class StockLot(models.Model):
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="lots")
    quantity_received = models.PositiveIntegerField()
    quantity_remaining = models.PositiveIntegerField()
    unit_cost_cents = models.PositiveIntegerField(null=True, blank=True)
    supplier_reference = models.CharField(max_length=100, blank=True)
    received_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["received_at", "id"]
        indexes = [models.Index(fields=["variant", "received_at"])]


class CustomerAddress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="store_addresses")
    label = models.CharField(max_length=40, default="Home")
    recipient = models.CharField(max_length=120)
    phone = models.CharField(max_length=32, blank=True)
    line1 = models.CharField(max_length=180)
    line2 = models.CharField(max_length=180, blank=True)
    postal_code = models.CharField(max_length=12)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_default", "id"]


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending payment"),
        ("payment_pending", "Payment processing"),
        ("paid", "Paid"),
        ("fulfilling", "Being prepared"),
        ("shipped", "Shipped"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("expired", "Expired"),
        ("payment_failed", "Payment failed"),
        ("refunded", "Refunded"),
    ]
    PAYMENT_CHOICES = [
        ("unpaid", "Unpaid"),
        ("pending", "Pending"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    reference = models.CharField(max_length=24, unique=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="store_orders")
    session_key = models.CharField(max_length=64, blank=True, db_index=True)
    checkout_key = models.CharField(max_length=180, unique=True)
    cart_fingerprint = models.CharField(max_length=64)
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="pending")
    payment_status = models.CharField(max_length=16, choices=PAYMENT_CHOICES, default="unpaid")
    currency = models.CharField(max_length=3, default="SGD")
    subtotal_cents = models.PositiveIntegerField()
    delivery_cents = models.PositiveIntegerField(default=0)
    total_cents = models.PositiveIntegerField()
    refunded_cents = models.PositiveIntegerField(default=0)
    analytics_consent = models.BooleanField(default=False)
    campaign_source = models.CharField(max_length=100, blank=True)
    campaign_medium = models.CharField(max_length=100, blank=True)
    campaign_name = models.CharField(max_length=120, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=32, blank=True)
    shipping_address = models.JSONField(default=dict, blank=True)
    stripe_session_id = models.CharField(max_length=128, unique=True, null=True, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=128, blank=True)
    stripe_session_url = models.URLField(max_length=1000, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True)
    carrier = models.CharField(max_length=80, blank=True)
    customer_note = models.TextField(blank=True)
    stock_finalized_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["payment_status", "-created_at"]),
            models.Index(fields=["paid_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = "SD" + timezone.now().strftime("%y%m%d") + uuid.uuid4().hex[:6].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.reference or str(self.public_id)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL)
    variant = models.ForeignKey(ProductVariant, null=True, blank=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=240)
    brand_name = models.CharField(max_length=100)
    size = models.CharField(max_length=32)
    sku = models.CharField(max_length=64)
    quantity = models.PositiveSmallIntegerField()
    unit_price_cents = models.PositiveIntegerField()
    unit_cost_cents = models.PositiveIntegerField(null=True, blank=True)
    reserved = models.BooleanField(default=True)
    returned_quantity = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["id"]

    @property
    def line_total_cents(self):
        return self.quantity * self.unit_price_cents


class ReturnRequest(models.Model):
    STATUS_CHOICES = [
        ("requested", "Requested"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("received", "Received"),
        ("refunded", "Refunded"),
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="return_requests")
    order_item = models.ForeignKey(OrderItem, on_delete=models.PROTECT, related_name="return_requests")
    customer_email = models.EmailField()
    reason = models.CharField(max_length=60)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="requested")
    requested_quantity = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class StorefrontEvent(models.Model):
    EVENT_TYPES = [
        ("session_started", "Session started"),
        ("product_viewed", "Product viewed"),
        ("search_performed", "Search performed"),
        ("cart_added", "Added to cart"),
        ("checkout_started", "Checkout started"),
        ("purchase_confirmed", "Purchase confirmed"),
    ]
    event_id = models.UUIDField(unique=True)
    event_type = models.CharField(max_length=32, choices=EVENT_TYPES)
    session_hash = models.CharField(max_length=64, db_index=True)
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL)
    order = models.ForeignKey(Order, null=True, blank=True, on_delete=models.SET_NULL)
    result_count = models.PositiveIntegerField(null=True, blank=True)
    campaign_source = models.CharField(max_length=100, blank=True)
    campaign_medium = models.CharField(max_length=100, blank=True)
    campaign_name = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    consented = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["event_type", "created_at"])]


class StripeWebhookEvent(models.Model):
    event_id = models.CharField(max_length=128, unique=True)
    event_type = models.CharField(max_length=120)
    status = models.CharField(max_length=16, default="received")
    error_message = models.CharField(max_length=240, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-received_at"]
