const DRAFT_KEY = 'sd-checkout-draft';
const ATTEMPT_KEY = 'sd-checkout-attempt';
const EMPTY_ADDRESS = { recipient: '', phone: '', line1: '', line2: '', postal_code: '', building: '', property_type: 'highrise' };
let memoryAttempt;

export function readCheckoutDraft() {
  try {
    const value = JSON.parse(sessionStorage.getItem(DRAFT_KEY)) || {};
    return {
      deliveryAddress: { ...EMPTY_ADDRESS, ...value.deliveryAddress },
      appliedPromo: ['DISTRICT10', 'SOLE20'].includes(value.appliedPromo) ? value.appliedPromo : '',
      promoInput: typeof value.promoInput === 'string' ? value.promoInput : '',
      useNewAddress: value.useNewAddress === true,
      selectedAddressId: value.selectedAddressId || null,
    };
  } catch {
    return { deliveryAddress: { ...EMPTY_ADDRESS }, appliedPromo: '', promoInput: '', useNewAddress: false, selectedAddressId: null };
  }
}

export function saveCheckoutDraft(value) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(value)); } catch { /* Storage can be disabled. */ }
}

export function checkoutFingerprint(lines, promo, address, total) {
  return JSON.stringify({
    items: lines.map(line => [line.variantId, line.quantity, line.variant.price ?? line.product.price]).sort((a, b) => a[0].localeCompare(b[0])),
    promo: promo.trim().toUpperCase(),
    address: Object.keys(EMPTY_ADDRESS).map(key => String(address?.[key] || '').trim()),
    total,
  });
}

export function getCheckoutKey(fingerprint) {
  let stored = memoryAttempt;
  try { stored = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY)) || stored; } catch { /* Fall back to memory. */ }
  if (stored?.fingerprint === fingerprint && typeof stored.key === 'string') return stored.key;
  const attempt = { fingerprint, key: crypto.randomUUID() };
  memoryAttempt = attempt;
  try { sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt)); } catch { /* Fall back to memory. */ }
  return attempt.key;
}

export function clearCheckoutDraft() {
  clearCheckoutAttempt();
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* Storage can be disabled. */ }
}

export function clearCheckoutAttempt() {
  memoryAttempt = undefined;
  try {
    sessionStorage.removeItem(ATTEMPT_KEY);
  } catch { /* Storage can be disabled. */ }
}
