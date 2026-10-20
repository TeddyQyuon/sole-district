import json
import re
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from shop.models import Brand, Category, InventoryMovement, Product, ProductImage, ProductVariant, StockLot


class Command(BaseCommand):
    help = "Create the illustrative SOLE DISTRICT catalogue. Seeded items are not sellable."

    @transaction.atomic
    def handle(self, *args, **options):
        source = Path(__file__).resolve().parents[4] / "data" / "catalog.json"
        if not source.exists():
            source = Path(__file__).resolve().parents[2] / "catalog_preview.json"
        records = json.loads(source.read_text(encoding="utf-8"))
        for row in records:
            brand_slug = re.sub(r"[^a-z0-9]+", "-", row["brand"].lower()).strip("-")
            brand, _ = Brand.objects.get_or_create(name=row["brand"], defaults={"slug": brand_slug})
            category_slug = re.sub(r"[^a-z0-9]+", "-", row["category"].lower()).strip("-")
            category, _ = Category.objects.get_or_create(name=row["category"], defaults={"slug": category_slug})
            product, created = Product.objects.get_or_create(
                slug=row["id"],
                defaults={
                    "brand": brand,
                    "category": category,
                    "name": row["name"],
                    "colour": row["color"],
                    "description": row["description"],
                    "details": row["detail"],
                    "image_url": row["image"],
                    "image_alt": row["brand"] + " " + row["name"] + " product image",
                    "price_cents": row["price"],
                    "status": "active",
                    "is_illustrative": True,
                    "sourcing_status": "not_reviewed",
                    "featured": row.get("featured", False),
                },
            )
            if not created:
                product.brand = brand
                product.category = category
                product.name = row["name"]
                product.colour = row["color"]
                product.description = row["description"]
                product.details = row["detail"]
                product.image_url = row["image"]
                product.price_cents = row["price"]
                product.featured = row.get("featured", False)
                product.save()

            raw_images = row.get("images", [])
            if not raw_images and row.get("image"):
                raw_images = [{"url": row["image"], "alt": product.image_alt}]
            
            existing_urls = set(product.images.values_list("image_url", flat=True))
            for idx, img in enumerate(raw_images):
                img_url = img["url"] if isinstance(img, dict) else str(img)
                img_alt = img.get("alt", product.image_alt) if isinstance(img, dict) else product.image_alt
                if img_url not in existing_urls:
                    ProductImage.objects.create(
                        product=product,
                        image_url=img_url,
                        alt_text=img_alt,
                        sort_order=idx,
                        is_primary=(idx == 0),
                    )
                    existing_urls.add(img_url)

            prefix = re.sub(r"[^A-Z0-9]+", "", row["id"].upper())[:14]
            for size in row["sizes"]:
                slug_size = re.sub(r"[^A-Z0-9]+", "-", size.upper()).strip("-")
                quantity = 0 if size in row.get("unavailable", []) else 8
                sku = (prefix + "-" + slug_size)[:64]
                variant, v_created = ProductVariant.objects.get_or_create(
                    product=product,
                    size=size,
                    defaults={
                        "sku": sku,
                        "size_system": "UK" if row["category"] == "Sneakers" else "INT",
                        "colour": row["color"],
                        "stock_on_hand": quantity,
                    }
                )
                if v_created and quantity:
                    InventoryMovement.objects.create(
                        variant=variant,
                        movement_type="received",
                        quantity_change=quantity,
                        reason="Illustrative preview stock. Not sellable.",
                    )
                    StockLot.objects.create(
                        variant=variant,
                        quantity_received=quantity,
                        quantity_remaining=quantity,
                        unit_cost_cents=None,
                        supplier_reference="Illustrative preview stock",
                    )
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(records)} illustrative catalogue products. Purchases remain disabled."))
