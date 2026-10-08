from django.contrib import admin
from .models import (
    Brand, Category, CustomerAddress, InventoryMovement, Order, OrderItem,
    Product, ProductImage, ProductVariant, ReturnRequest, StockLot, StorefrontEvent,
    StripeWebhookEvent,
)


class VariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    readonly_fields = ("reserved_stock",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "brand", "category", "status", "is_illustrative", "sourcing_status", "price_cents")
    list_filter = ("status", "is_illustrative", "sourcing_status", "category", "brand")
    search_fields = ("name", "slug", "brand__name", "variants__sku")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [VariantInline]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("reference", "status", "payment_status", "customer_email", "total_cents", "created_at")
    list_filter = ("status", "payment_status", "created_at")
    search_fields = ("reference", "customer_email", "stripe_session_id")
    readonly_fields = ("public_id", "checkout_key", "cart_fingerprint", "stripe_session_id", "stripe_payment_intent_id", "created_at")


admin.site.register([Brand, Category, ProductImage, InventoryMovement, OrderItem, ReturnRequest, StockLot, CustomerAddress, StorefrontEvent, StripeWebhookEvent])
