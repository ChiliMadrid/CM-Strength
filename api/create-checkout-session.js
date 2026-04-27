const { getProduct } = require('./_lib/products');
const { getStripe } = require('./_lib/stripe');

const stripe = getStripe();

const PACKAGES = {
  virtual: {
    productKey: 'coaching-virtual'
  },
  'coaching-virtual': {
    productKey: 'coaching-virtual'
  },
  'body-profile': {
    productKey: 'coaching-body-profile'
  },
  'coaching-body-profile': {
    productKey: 'coaching-body-profile'
  },
  hybrid: {
    productKey: 'coaching-hybrid'
  },
  'coaching-hybrid': {
    productKey: 'coaching-hybrid'
  },
  's-tier': {
    productKey: 'coaching-s-tier'
  },
  'coaching-s-tier': {
    productKey: 'coaching-s-tier'
  }
};

function buildCheckoutItems(body) {
  const rawItems = Array.isArray(body.items) && body.items.length
    ? body.items
    : [{ productKey: PACKAGES[body.package]?.productKey || PACKAGES.virtual.productKey, quantity: 1 }];

  return rawItems.map(item => {
    const product = getProduct(item.productKey);
    if (!product) {
      throw new Error('One or more cart items cannot be checked out yet.');
    }

    const quantity = Math.max(1, Math.min(Number(item.quantity || 1), 10));
    const months = product.type === 'coaching'
      ? Math.max(1, Math.min(Number(item.months || 1), 14))
      : 1;
    const discount = months >= 12 ? 0.10 : months >= 6 ? 0.05 : 0;
    const amount = months > 1
      ? Math.round(product.amount * months * (1 - discount))
      : product.amount;
    const name = months > 1
      ? `${product.name} - Paid in Full (${months} months)`
      : product.name;

    return { productKey: item.productKey, product, quantity, amount, name };
  });
}

function normalizeBaseUrl(url) {
  const fallback = 'https://cmstrength.cc';
  const value = String(url || '').trim();
  if (!value) return fallback;

  try {
    const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

function getCheckoutBaseUrl(req) {
  if (process.env.SITE_URL) return normalizeBaseUrl(process.env.SITE_URL);
  if (process.env.NEXT_PUBLIC_APP_URL) return normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return normalizeBaseUrl(host ? `${proto}://${host}` : '');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe secret key is not configured.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const checkoutItems = buildCheckoutItems(body);
    const baseUrl = getCheckoutBaseUrl(req);
    const productKeys = checkoutItems.map(item => item.productKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: body.email || undefined,
      allow_promotion_codes: true,
      line_items: checkoutItems.map(item => ({
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          product_data: {
            name: `CM Strength - ${item.name}`
          },
          unit_amount: item.amount
        }
      })),
      metadata: {
        product_keys: productKeys.join(','),
        has_pdfs: checkoutItems.some(item => item.product.type === 'pdf') ? 'true' : 'false',
        source: Array.isArray(body.items) && body.items.length ? 'cm-strength-cart' : 'cm-strength-payment-page'
      },
      success_url: `${baseUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment.html`
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to create checkout session.' });
  }
};
