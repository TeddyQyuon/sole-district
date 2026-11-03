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

        # 1. Bulk ensure Brands
        existing_brands = {b.name: b for b in Brand.objects.all()}
        new_brands = {}
        for row in records:
            b_name = row["brand"]
            if b_name not in existing_brands and b_name not in new_brands:
                b_slug = re.sub(r"[^a-z0-9]+", "-", b_name.lower()).strip("-")
                new_brands[b_name] = Brand(name=b_name, slug=b_slug)
        if new_brands:
            Brand.objects.bulk_create(list(new_brands.values()), ignore_conflicts=True)
            existing_brands = {b.name: b for b in Brand.objects.all()}

        # 2. Bulk ensure Categories
        existing_categories = {c.name: c for c in Category.objects.all()}
        new_categories = {}
        for row in records:
            c_name = row["category"]
            if c_name not in existing_categories and c_name not in new_categories:
                c_slug = re.sub(r"[^a-z0-9]+", "-", c_name.lower()).strip("-")
                new_categories[c_name] = Category(name=c_name, slug=c_slug)
        if new_categories:
            Category.objects.bulk_create(list(new_categories.values()), ignore_conflicts=True)
            existing_categories = {c.name: c for c in Category.objects.all()}

        # 3. Bulk create / update Products
        existing_products = {p.slug: p for p in Product.objects.all()}
        products_to_create = []
        products_to_update = []
        for row in records:
            brand = existing_brands[row["brand"]]
            category = existing_categories[row["category"]]
            image_alt = row["brand"] + " " + row["name"] + " product image"
            existing = existing_products.get(row["id"])
            if existing is None:
                products_to_create.append(
                    Product(
                        slug=row["id"],
                        brand=brand,
                        category=category,
                        name=row["name"],
                        colour=row["color"],
                        description=row["description"],
                        details=row["detail"],
                        image_url=row["image"],
                        image_alt=image_alt,
                        price_cents=row["price"],
                        status="active",
                        is_illustrative=True,
                        sourcing_status="not_reviewed",
                        featured=row.get("featured", False),
                    )
                )
            else:
                changed = (
                    existing.brand_id != brand.id
                    or existing.category_id != category.id
                    or existing.name != row["name"]
                    or existing.colour != row["color"]
                    or existing.description != row["description"]
                    or existing.details != row["detail"]
                    or existing.image_url != row["image"]
                    or existing.price_cents != row["price"]
                    or existing.featured != row.get("featured", False)
                )
                if changed:
                    existing.brand = brand
                    existing.category = category
                    existing.name = row["name"]
                    existing.colour = row["color"]
                    existing.description = row["description"]
                    existing.details = row["detail"]
                    existing.image_url = row["image"]
                    existing.price_cents = row["price"]
                    existing.featured = row.get("featured", False)
                    products_to_update.append(existing)

        if products_to_create:
            Product.objects.bulk_create(products_to_create, batch_size=200)
        if products_to_update:
            Product.objects.bulk_update(
                products_to_update,
                [
                    "brand",
                    "category",
                    "name",
                    "colour",
                    "description",
                    "details",
                    "image_url",
                    "price_cents",
                    "featured",
                ],
                batch_size=200,
            )

        products_by_slug = {p.slug: p for p in Product.objects.all()}

        # 4. Bulk create ProductImages
        existing_images = set(ProductImage.objects.values_list("product_id", "image_url"))
        images_to_create = []
        for row in records:
            product = products_by_slug[row["id"]]
            default_alt = row["brand"] + " " + row["name"] + " product image"
            raw_images = row.get("images", [])
            if not raw_images and row.get("image"):
                raw_images = [{"url": row["image"], "alt": default_alt}]
            for idx, img in enumerate(raw_images):
                img_url = img["url"] if isinstance(img, dict) else str(img)
                img_alt = img.get("alt", default_alt) if isinstance(img, dict) else default_alt
                pair = (product.id, img_url)
                if pair not in existing_images:
                    images_to_create.append(
                        ProductImage(
                            product=product,
                            image_url=img_url,
                            alt_text=img_alt,
                            sort_order=idx,
                            is_primary=(idx == 0),
                        )
                    )
                    existing_images.add(pair)
        if images_to_create:
            ProductImage.objects.bulk_create(images_to_create, batch_size=500)

        # 5. Bulk create ProductVariants, InventoryMovements & StockLots
        existing_variants = set(ProductVariant.objects.values_list("product_id", "size"))
        variants_to_create = []
        new_variant_keys = set()
        for row in records:
            product = products_by_slug[row["id"]]
            prefix = f"{re.sub(r'[^A-Z0-9]+', '', row['id'].upper())[:40]}-{product.pk}"
            unavailable = set(row.get("unavailable", []))
            size_system = "UK" if row["category"] == "Sneakers" else "INT"
            for size in row["sizes"]:
                v_key = (product.id, size)
                if v_key in existing_variants:
                    continue
                slug_size = re.sub(r"[^A-Z0-9]+", "-", size.upper()).strip("-")
                quantity = 0 if size in unavailable else 8
                sku = (prefix + "-" + slug_size)[:64]
                variants_to_create.append(
                    ProductVariant(
                        product=product,
                        size=size,
                        sku=sku,
                        size_system=size_system,
                        colour=row["color"],
                        stock_on_hand=quantity,
                    )
                )
                existing_variants.add(v_key)
                if quantity > 0:
                    new_variant_keys.add(v_key)

        if variants_to_create:
            ProductVariant.objects.bulk_create(variants_to_create, batch_size=500)
            if new_variant_keys:
                product_ids = {pid for pid, _ in new_variant_keys}
                movements_to_create = []
                lots_to_create = []
                for variant in ProductVariant.objects.filter(product_id__in=product_ids):
                    if (variant.product_id, variant.size) in new_variant_keys and variant.stock_on_hand > 0:
                        movements_to_create.append(
                            InventoryMovement(
                                variant=variant,
                                movement_type="received",
                                quantity_change=variant.stock_on_hand,
                                reason="Illustrative preview stock. Not sellable.",
                            )
                        )
                        lots_to_create.append(
                            StockLot(
                                variant=variant,
                                quantity_received=variant.stock_on_hand,
                                quantity_remaining=variant.stock_on_hand,
                                unit_cost_cents=None,
                                supplier_reference="Illustrative preview stock",
                            )
                        )
                if movements_to_create:
                    InventoryMovement.objects.bulk_create(movements_to_create, batch_size=500)
                if lots_to_create:
                    StockLot.objects.bulk_create(lots_to_create, batch_size=500)

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {len(records)} illustrative catalogue products. Purchases remain disabled.")
        )
