const test = require('node:test');
const assert = require('node:assert/strict');
const stripeModule = require.resolve('../api/_lib/stripe');
let created;
let retrieved;
require.cache[stripeModule] = { id: stripeModule, filename: stripeModule, loaded: true, exports: { getStripe: () => ({ checkout: { sessions: {
  create: async data => { created = data; return { url: 'https://checkout.stripe.test/fixture' }; },
  retrieve: async () => retrieved
} } }) } };
process.env.STRIPE_SECRET_KEY = 'sk_test_fixture';
process.env.SITE_URL = 'https://example.test';
const checkout = require('../api/create-checkout-session');
const fulfill = require('../api/fulfill-checkout-session');
const delivery = require('../api/_lib/pdf-delivery');
const { getProduct } = require('../api/_lib/products');
const formHandler = require('../api/form-submit');
function response() {
  return { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
}

test('server checkout uses catalog prices and four-week duration, with Korean locale', async () => {
  const res = response();
  await checkout({ method: 'POST', headers: {}, body: { language: 'ko', items: [{ productKey: 'coaching-virtual', months: 6, price: 1 }] } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(created.line_items[0].price_data.unit_amount, 1140000);
  assert.match(created.line_items[0].price_data.product_data.name, /6 four-week blocks/);
  assert.equal(created.locale, 'ko'); assert.equal(created.metadata.language, 'ko');
  assert.equal(created.success_url, 'https://example.test/payment-success.html?session_id={CHECKOUT_SESSION_ID}');
});

test('server rejects unknown PDF editions and malformed quantities/durations', async () => {
  for (const item of [
    { productKey: 'pdf-first-flame-ko' },
    { productKey: 'coaching-virtual', months: 1.5 },
    { productKey: 'coaching-virtual', months: 15 },
    { productKey: 'coaching-virtual', quantity: 1.5 },
    { productKey: 'coaching-in-person-single', months: 6 }
  ]) {
    created = null; const res = response();
    await checkout({ method: 'POST', headers: {}, body: { items: [item] } }, res);
    assert.notEqual(res.statusCode, 200); assert.equal(created, null);
  }
});

test('fulfillment returns coaching onboarding only after Stripe reports paid', async () => {
  retrieved = { id: 'cs_test_fixture', payment_status: 'unpaid', metadata: { product_keys: 'coaching-virtual' } };
  let res = response(); await fulfill({ method: 'POST', body: { session_id: 'cs_test_fixture' } }, res);
  assert.equal(res.statusCode, 409); assert.equal(res.data.has_coaching, undefined);
  retrieved.payment_status = 'paid';
  res = response(); await fulfill({ method: 'POST', body: { session_id: 'cs_test_fixture' } }, res);
  assert.equal(res.data.paid, true); assert.equal(res.data.has_coaching, true); assert.equal(res.data.delivered, false);
});

test('Korean delivery email clearly identifies an English PDF and preserves idempotency', async t => {
  process.env.RESEND_API_KEY = 'test_fixture'; process.env.RESEND_FROM_EMAIL = 'fixture@example.test';
  let sent;
  t.mock.method(globalThis, 'fetch', async (url, options) => { sent = { url, ...options, body: JSON.parse(options.body) }; return { ok: true }; });
  await delivery.sendPdfEmail({ to: 'fixture@example.test', products: [getProduct('pdf-first-flame-en')], sessionId: 'cs_test_fixture', language: 'ko' });
  assert.match(sent.body.subject, /영문 PDF/);
  assert.match(sent.body.html, /본문은 영어/);
  assert.equal(sent.body.attachments[0].filename, 'The First Flame.pdf');
  assert.equal(sent.headers['Idempotency-Key'], 'cm-strength-pdf-cs_test_fixture');
});

test('contact spam field is recognized in the nested browser payload without sending email', async t => {
  process.env.RESEND_API_KEY = 'test_fixture'; process.env.RESEND_FROM_EMAIL = 'fixture@example.test';
  t.mock.method(globalThis, 'fetch', () => { throw new Error('must not send'); });
  const res = response();
  await formHandler({ method: 'POST', headers: {}, body: { formType: 'contact', fields: { company: 'spam', email: 'fixture@example.test' } } }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.data.ok, true);
});
