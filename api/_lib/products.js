const path = require('path');

const COACHING_PRODUCTS = {
  'coaching-virtual': {
    name: 'Virtual Coaching',
    type: 'coaching',
    amount: 200000
  },
  'coaching-body-profile': {
    name: 'Body Profile',
    type: 'coaching',
    amount: 400000
  },
  'coaching-hybrid': {
    name: 'Hybrid Coaching',
    type: 'coaching',
    amount: 600000
  },
  'coaching-s-tier': {
    name: 'S-Tier',
    type: 'coaching',
    amount: 800000
  },
  'coaching-in-person-single': {
    name: '1:1 In-Person Training Session',
    type: 'coaching',
    amount: 60000
  },
  'coaching-in-person-10': {
    name: '10 In-Person Training Sessions',
    type: 'coaching',
    amount: 500000
  }
};

const PDF_PRODUCTS = {
  'pdf-first-flame-en': {
    name: 'The First Flame - English PDF',
    type: 'pdf',
    amount: 60000,
    filename: 'The First Flame.pdf'
  },
  'pdf-lotus-en': {
    name: 'Lotus V2 - English PDF',
    type: 'pdf',
    amount: 75000,
    filename: 'Lotus.pdf'
  },
  'pdf-total-war-en': {
    name: 'Total War - English PDF',
    type: 'pdf',
    amount: 75000,
    filename: 'Total War.pdf'
  },
  'pdf-dynasty-en': {
    name: 'Dynasty - English PDF',
    type: 'pdf',
    amount: 100000,
    filename: 'Dynasty.pdf'
  },
  'pdf-hell-joseon-en': {
    name: 'Hell Joseon - English PDF',
    type: 'pdf',
    amount: 75000,
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
