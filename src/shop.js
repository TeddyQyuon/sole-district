import seed from '../data/catalog.json';

export function sortVariantsBySize(variants) {
  if (!Array.isArray(variants)) return [];
  const clothingOrder = {
    'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, 'XXL': 7, '3XL': 8, 'One size': 99,
  };
  return [...variants].sort((a, b) => {
    const numA = parseFloat(a.size);
    const numB = parseFloat(b.size);
    const isNumA = !isNaN(numA) && !isNaN(Number(a.size));
    const isNumB = !isNaN(numB) && !isNaN(Number(b.size));
    if (isNumA && isNumB) return numA - numB;
    if (isNumA) return -1;
    if (isNumB) return 1;
    const cA = clothingOrder[a.size] ?? 50;
    const cB = clothingOrder[b.size] ?? 50;
    if (cA !== cB) return cA - cB;
    return String(a.size).localeCompare(String(b.size), undefined, { numeric: true });
  });
}

export const initialProducts = seed.map((product) => ({
  ...product,
  illustrative: true,
  sellable: false,
  images: Array.isArray(product.images) && product.images.length
    ? product.images
    : [{ url: product.image, alt: product.brand + ' ' + product.name }],
  variants: sortVariantsBySize(product.sizes.map((size) => ({
    id: product.id + ':' + size,
    legacy_id: product.id + ':' + size,
    size,
    size_system: product.category === 'Sneakers' ? 'UK' : 'INT',
    available: product.unavailable.includes(size) ? 0 : 8,
  }))),
}));

export const money = (cents) =>
  new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100).replace('SGD', 'S$');

export const shipping = (subtotal) => (subtotal >= 15000 ? 0 : 800);

export function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Shopping remains usable when browser storage is disabled.
  }
}

export const validCart = (raw) =>
  Array.isArray(raw)
    ? raw
        .filter(
          (item) =>
            item &&
            typeof item.variantId === 'string' &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= 10,
        )
        .slice(0, 30)
    : [];

export function cartLines(cart, products) {
  return cart.flatMap((item) => {
    const product = products.find((candidate) =>
      candidate.variants.some((variant) =>
        variant.id === item.variantId ||
        variant.legacy_id === item.variantId ||
        (variant.sku && item.variantId === 'sku:' + variant.sku)
      ),
    );
    const variant = product?.variants.find((candidate) =>
      candidate.id === item.variantId ||
      candidate.legacy_id === item.variantId ||
      (candidate.sku && item.variantId === 'sku:' + candidate.sku)
    );
    return product && variant ? [{ ...item, product, variant }] : [];
  });
}

let csrfValue = '';

async function getCsrf() {
  const response = await fetch('/api/csrf/', { credentials: 'same-origin' });
  const data = await response.json();
  if (!response.ok || !data.csrf) throw new Error('Could not start a secure store session.');
  csrfValue = data.csrf;
  return csrfValue;
}

export async function api(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !headers.has('X-CSRFToken')) {
    headers.set('X-CSRFToken', csrfValue || (await getCsrf()));
  }
  const request = () => fetch('/api/' + path.replace(/^\//, ''), {
    credentials: 'same-origin',
    ...options,
    method,
    headers,
  });
  let response = await request();
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The store is temporarily unavailable. Please try again shortly.');
  }
  if (response.status === 403 && data.csrf_error && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    csrfValue = await getCsrf();
    headers.set('X-CSRFToken', csrfValue);
    response = await request();
    try {
      data = await response.json();
    } catch {
      throw new Error('The store is temporarily unavailable. Please try again shortly.');
    }
  }
  if (!response.ok) throw new Error(data.error || 'Please try again shortly.');
  return data;
}

export async function trackEvent(eventType, fields = {}) {
  if (localStorage.getItem('sd-analytics-consent') !== 'accepted') return;
  const sessionId = sessionStorage.getItem('sd-analytics-session') || crypto.randomUUID();
  sessionStorage.setItem('sd-analytics-session', sessionId);
  let campaign = {};
  try {
    campaign = JSON.parse(sessionStorage.getItem('sd-campaign') || '{}');
  } catch {}
  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source');
  if (!campaign.source && source) {
    campaign = {
      source: source.slice(0, 100),
      medium: (params.get('utm_medium') || '').slice(0, 100),
      name: (params.get('utm_campaign') || '').slice(0, 120),
    };
    sessionStorage.setItem('sd-campaign', JSON.stringify(campaign));
  }
  const eventKey = 'sd-event:' + eventType + ':' + (fields.product_id || fields.result_count || 'session');
  let eventId = sessionStorage.getItem(eventKey);
  if (!eventId || eventType !== 'session_started') {
    eventId = crypto.randomUUID();
    sessionStorage.setItem(eventKey, eventId);
  }
  try {
    await api('events/', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        event_type: eventType,
        campaign_source: campaign.source || '',
        campaign_medium: campaign.medium || '',
        campaign_name: campaign.name || '',
        ...fields,
      }),
    });
  } catch {
    // Optional analytics never blocks shopping.
  }
}
