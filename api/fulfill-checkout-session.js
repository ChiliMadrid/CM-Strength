const Stripe = require('stripe');
const { deliverSessionPdfs } = require('./_lib/pdf-delivery');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing');

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
    const sessionId = String(body.session_id || '').trim();

    if (!sessionId.startsWith('cs_')) {
      return res.status(400).json({ error: 'A valid Checkout Session ID is required.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(409).json({ error: 'Payment is not complete yet.', payment_status: session.payment_status });
    }

    const result = await deliverSessionPdfs(session);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Checkout fulfillment failed:', error);
    return res.status(500).json({ error: error.message || 'Unable to fulfill checkout session.' });
  }
};
