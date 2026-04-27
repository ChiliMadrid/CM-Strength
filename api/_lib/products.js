const path = require('path');

const COACHING_PRODUCTS = {
  'coaching-virtual': {
    name: 'Virtual Coaching',
    type: 'coaching',
    amount: 15000
  },
  'coaching-body-profile': {
    name: 'Body Profile',
    type: 'coaching',
    amount: 30000
  },
  'coaching-hybrid': {
    name: 'Hybrid Coaching',
    type: 'coaching',
    amount: 45000
  },
  'coaching-s-tier': {
    name: 'S-Tier',
    type: 'coaching',
    amount: 60000
  }
};

const PDF_PRODUCTS = {
  'pdf-first-flame-en': {
    name: 'The First Flame - English PDF',
    type: 'pdf',
    amount: 4000,
    filename: 'The First Flame.pdf'
  },
  'pdf-lotus-en': {
    name: 'Lotus V2 - English PDF',
    type: 'pdf',
    amount: 5000,
    filename: 'Lotus.pdf'
  },
  'pdf-dynasty-en': {
    name: 'Dynasty - English PDF',
    type: 'pdf',
    amount: 7500,
    filename: 'Dynasty.pdf'
  },
  'pdf-hell-joseon-en': {
    name: 'Hell Joseon - English PDF',
    type: 'pdf',
    amount: 5000,
    filename: 'Hell Joseon.pdf'
  }
};

const PRODUCTS = {
  ...COACHING_PRODUCTS,
  ...PDF_PRODUCTS
};

function getProduct(key) {
  return PRODUCTS[String(key || '')] || null;
}

function getPdfPath(product) {
  if (!product || !product.filename) return null;
  return path.join(process.cwd(), 'api', '_private', 'EnglishPDF', product.filename);
}

module.exports = {
  COACHING_PRODUCTS,
  PDF_PRODUCTS,
  PRODUCTS,
  getProduct,
  getPdfPath
};
