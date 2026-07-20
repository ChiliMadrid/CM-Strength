const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CURRENCY,
  COACHING_PRODUCTS,
  PDF_PRODUCTS,
  PRODUCTS,
  getProduct,
  getPdfPath
} = require('../api/_lib/products');

const EXPECTED_AMOUNTS = {
  'coaching-virtual': 200000,
  'coaching-body-profile': 400000,
  'coaching-hybrid': 600000,
  'coaching-s-tier': 800000,
  'coaching-in-person-single': 60000,
  'coaching-in-person-10': 500000,
  'pdf-first-flame-en': 60000,
  'pdf-lotus-en': 75000,
  'pdf-total-war-en': 75000,
  'pdf-dynasty-en': 100000,
  'pdf-hell-joseon-en': 75000
};

test('catalog exposes the expected KRW amounts', () => {
  assert.equal(CURRENCY, 'krw');
  assert.deepEqual(
    Object.fromEntries(Object.entries(PRODUCTS).map(([key, product]) => [key, product.amount])),
    EXPECTED_AMOUNTS
  );
  assert.ok(Object.values(PRODUCTS).every(product => product.currency === CURRENCY));
});

test('catalog keeps coaching and PDF products separated', () => {
  assert.ok(Object.values(COACHING_PRODUCTS).every(product => product.type === 'coaching'));
  assert.ok(Object.values(PDF_PRODUCTS).every(product => product.type === 'pdf'));
  assert.equal(Object.keys(PRODUCTS).length, Object.keys(EXPECTED_AMOUNTS).length);
});

test('PDF products resolve private delivery paths', () => {
  for (const product of Object.values(PDF_PRODUCTS)) {
    assert.match(getPdfPath(product), /api[\\/]_private[\\/]EnglishPDF/);
    assert.ok(getPdfPath(product).endsWith(product.filename));
  }
});

test('unknown product keys stay rejected', () => {
  assert.equal(getProduct('not-a-product'), null);
  assert.equal(getProduct(), null);
});
