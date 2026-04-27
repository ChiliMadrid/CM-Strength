const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover'
});

const PACKAGES = {
  virtual: {
    name: 'Virtual Coaching',
    amount: 15000
  },
  'body-profile': {
    name: 'Body Profile',
    amount: 30000
  },
  hybrid: {
    name: 'Hybrid Coaching',
    amount: 45000
  },
  's-tier': {
    name: 'S-Tier',
    amount: 60000
  }
};

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
    const selectedPackage = PACKAGES[body.package] || PACKAGES.virtual;
    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: body.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            product_data: {
              name: `CM Strength - ${selectedPackage.name}`
            },
            unit_amount: selectedPackage.amount
          }
        }
      ],
      metadata: {
        package: selectedPackage.name,
        source: 'cm-strength-payment-page'
      },
      success_url: `${origin}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment.html`
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to create checkout session.' });
  }
};
