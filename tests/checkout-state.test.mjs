import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutFingerprint, clearCheckoutDraft, getCheckoutKey, readCheckoutDraft, saveCheckoutDraft } from '../src/checkoutState.js';

const values = new Map();
globalThis.sessionStorage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
const lines = [{ variantId: 'runner:8', quantity: 1, product: { price: 31900 }, variant: {} }];
const address = { recipient: 'Test Buyer', phone: '81234567', postal_code: '238801', line1: '2 Orchard Turn', line2: '#01-01' };

test('checkout attempt changes with promo, price, quantity or address and survives refresh', () => {
  const fingerprint = checkoutFingerprint(lines, '', address, 31900);
  const original = getCheckoutKey(fingerprint);
  assert.equal(getCheckoutKey(fingerprint), original);
  const discounted = checkoutFingerprint(lines, 'SOLE20', address, 29900);
  assert.notEqual(getCheckoutKey(discounted), original);
  assert.equal(getCheckoutKey(discounted), JSON.parse(values.get('sd-checkout-attempt')).key);
  assert.notEqual(checkoutFingerprint(lines, 'DISTRICT10', address, 28710), discounted);
  assert.notEqual(checkoutFingerprint(lines, 'SOLE20', { ...address, line2: '#02-01' }, 29900), discounted);
  assert.notEqual(checkoutFingerprint([{ ...lines[0], quantity: 2 }], 'SOLE20', address, 61800), discounted);
  assert.notEqual(checkoutFingerprint([{ ...lines[0], variant: { price: 32900 } }], 'SOLE20', address, 29900), discounted);
});

test('delivery fields, applied promo and unfinished promo entry restore without saving payment details', () => {
  saveCheckoutDraft({ deliveryAddress: address, appliedPromo: 'SOLE20', promoInput: 'DIST', useNewAddress: true, selectedAddressId: 42 });
  const draft = readCheckoutDraft();
  assert.equal(draft.deliveryAddress.line2, '#01-01');
  assert.equal(draft.appliedPromo, 'SOLE20');
  assert.equal(draft.promoInput, 'DIST');
  assert.equal(draft.selectedAddressId, 42);
  assert.equal(draft.useNewAddress, true);
  clearCheckoutDraft();
  assert.equal(readCheckoutDraft().appliedPromo, '');
  assert.equal(readCheckoutDraft().deliveryAddress.recipient, '');
});

test('corrupt or unavailable browser storage does not prevent checkout', () => {
  values.set('sd-checkout-draft', '{');
  assert.equal(readCheckoutDraft().appliedPromo, '');
  const storage = globalThis.sessionStorage;
  globalThis.sessionStorage = { getItem() { throw Error(); }, setItem() { throw Error(); }, removeItem() { throw Error(); } };
  assert.equal(readCheckoutDraft().deliveryAddress.phone, '');
  assert.doesNotThrow(() => saveCheckoutDraft({}));
  const key = getCheckoutKey('storage-disabled');
  assert.equal(getCheckoutKey('storage-disabled'), key);
  assert.doesNotThrow(clearCheckoutDraft);
  globalThis.sessionStorage = storage;
});
