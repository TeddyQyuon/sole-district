// Helper functions for Sole District v2 catalog contract
// Gracefully handles optional fields: subcategory, addedAt, retailPrice, tags

export function isNewIn(product) {
  if (!product) return false;
  if (product.badge && /^new(\s+in)?$/i.test(product.badge.trim())) return true;
  if (!product.addedAt) return false;
  const addedMs = Date.parse(product.addedAt);
  if (Number.isNaN(addedMs)) return false;
  const nowMs = Date.now();
  // Support both live wall clock and the catalog anchor date (2026-11-03)
  const anchorMs = Math.abs(nowMs - addedMs) <= 60 * 86400000
    ? nowMs
    : Date.parse('2026-11-03T23:59:59Z');
  const diffDays = (anchorMs - addedMs) / 86400000;
  return diffDays >= -7 && diffDays <= 45;
}

export function isOnSale(product) {
  if (!product) return false;
  return typeof product.retailPrice === 'number' && product.retailPrice > product.price;
}

export function discountPercent(product) {
  if (!isOnSale(product)) return 0;
  return Math.round(((product.retailPrice - product.price) / product.retailPrice) * 100);
}

export function getAvailableSizeCount(product) {
  if (!product?.variants?.length) return 0;
  return product.variants.filter((v) => v.available > 0).length;
}

export function isSoldOut(product) {
  if (!product?.variants?.length) return false;
  return product.variants.every((v) => v.available < 1);
}

export function isLowStock(product) {
  if (!product?.variants?.length || isSoldOut(product)) return false;
  const totalSizes = product.variants.length;
  const availSizes = getAvailableSizeCount(product);
  const totalUnits = product.variants.reduce((sum, v) => sum + (v.available || 0), 0);
  if (totalSizes >= 3 && availSizes <= 2) return true;
  if (totalUnits > 0 && totalUnits <= 4) return true;
  return false;
}

export function getDerivedBrands(products) {
  const map = new Map();
  for (const p of products) {
    if (!p?.brand) continue;
    const entry = map.get(p.brand) || {
      name: p.brand,
      count: 0,
      categories: new Set(),
      sampleImage: p.images?.[0]?.url || p.image,
    };
    entry.count += 1;
    if (p.category) entry.categories.add(p.category);
    if (!entry.sampleImage && (p.images?.[0]?.url || p.image)) {
      entry.sampleImage = p.images?.[0]?.url || p.image;
    }
    map.set(p.brand, entry);
  }
  return [...map.values()]
    .map((b) => ({ ...b, categories: [...b.categories] }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getDerivedSubcategories(products, categoryFilter = '') {
  const map = new Map();
  for (const p of products) {
    if (categoryFilter && p.category !== categoryFilter) continue;
    if (!p?.subcategory) continue;
    map.set(p.subcategory, (map.get(p.subcategory) || 0) + 1);
  }
  const preferredOrder = [
    'Hoodies & Sweats',
    'Tees',
    'Pants & Shorts',
    'Outerwear',
    'Headwear',
    'Bags',
    'Socks',
    'Small Goods',
  ];
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      const idxA = preferredOrder.indexOf(a.name);
      const idxB = preferredOrder.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.count - a.count || a.name.localeCompare(b.name);
    });
}

export function getDerivedSilhouettes(products, brandFilter = '') {
  const map = new Map();
  for (const p of products) {
    if (brandFilter && p.brand !== brandFilter) continue;
    if (!p?.silhouette) continue;
    map.set(p.silhouette, (map.get(p.silhouette) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export const CLOTHING_SUBCATEGORIES = [
  'Hoodies & Sweats',
  'Tees',
  'Pants & Shorts',
  'Outerwear',
];

export const ACCESSORY_SUBCATEGORIES = [
  'Headwear',
  'Bags',
  'Socks',
  'Small Goods',
];
