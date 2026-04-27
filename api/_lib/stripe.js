const Stripe = require('stripe');

const STRIPE_API_VERSION = '2026-02-25.clover';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing', {
    apiVersion: STRIPE_API_VERSION
  });
}

module.exports = {
  STRIPE_API_VERSION,
  getStripe
};
