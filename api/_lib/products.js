const path = require('path');

const CURRENCY = 'krw';

function coachingProduct(name, amount) {
  return { name, type: 'coaching', currency: CURRENCY, amount };
}

function pdfProduct(name, amount, filename) {
  return { name, type: 'pdf', currency: CURRENCY, amount, filename };
}

const COACHING_PRODUCTS = {
  'coaching-virtual': coachingProduct('Virtual Coaching', 200000),
  'coaching-body-profile': coachingProduct('Body Profile', 400000),
  'coaching-hybrid': coachingProduct('Hybrid Coaching', 600000),
  'coaching-s-tier': coachingProduct('S-Tier', 800000),
  'coaching-in-person-single': coachingProduct('1:1 In-Person Training Session', 60000),
  'coaching-in-person-10': coachingProduct('10 In-Person Training Sessions', 500000)
};

const PDF_PRODUCTS = {
  'pdf-first-flame-en': pdfProduct('The First Flame - English PDF', 60000, 'The First Flame.pdf'),
  'pdf-lotus-en': pdfProduct('Lotus V2 - English PDF', 75000, 'Lotus.pdf'),
  'pdf-total-war-en': pdfProduct('Total War - English PDF', 75000, 'Total War.pdf'),
  'pdf-dynasty-en': pdfProduct('Dynasty - English PDF', 100000, 'Dynasty.pdf'),
  'pdf-hell-joseon-en': pdfProduct('Hell Joseon - English PDF', 75000, 'Hell Joseon.pdf')
};

const PRODUCTS = {
  ...COACHING_PRODUCTS,
  ...PDF_PRODUCTS
};

function getProduct(key) {
  return PRODUCTS[String(key || '')] || null;
}

function getPdfPath(product) {
  if (!product?.filename) return null;
  return path.join(process.cwd(), 'api', '_private', 'EnglishPDF', product.filename);
}

module.exports = {
  CURRENCY,
  COACHING_PRODUCTS,
  PDF_PRODUCTS,
  PRODUCTS,
  getProduct,
  getPdfPath
};
