const Stripe = require('stripe');
const getRawBody = require('raw-body');
const { deliverSessionPdfs } = require('./_lib/pdf-delivery');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Stripe webhook is not configured.' });
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ error: `Webhook verification failed: ${error.message}` });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await deliverSessionPdfs(session);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return res.status(500).json({ error: error.message || 'Webhook processing failed.' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
