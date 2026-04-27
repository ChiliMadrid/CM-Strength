const fs = require('fs');
const Stripe = require('stripe');
const getRawBody = require('raw-body');
const { getProduct, getPdfPath } = require('./_lib/products');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_missing');
const OWNER_EMAIL = process.env.SITE_OWNER_EMAIL || 'coach.cmstrength@gmail.com';

async function sendPdfEmail({ to, products, sessionId }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error('PDF email delivery is not configured.');
  }

  const attachments = products
    .map(product => {
      const filePath = getPdfPath(product);
      if (!filePath || !fs.existsSync(filePath)) return null;
      return {
        filename: product.filename,
        content: fs.readFileSync(filePath).toString('base64')
      };
    })
    .filter(Boolean);

  if (!attachments.length) return;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      bcc: [OWNER_EMAIL],
      subject: 'Your CM Strength PDF program',
      html: `
        <p>Thank you for your CM Strength purchase.</p>
        <p>Your PDF program${attachments.length > 1 ? 's are' : ' is'} attached to this email.</p>
        <p>If you have any trouble opening the file, reply to this email with your checkout reference: ${sessionId}.</p>
      `,
      attachments
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend email failed: ${text}`);
  }
}

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
      const customerEmail = session.customer_details?.email || session.customer_email;
      const productKeys = String(session.metadata?.product_keys || '')
        .split(',')
        .map(key => key.trim())
        .filter(Boolean);
      const pdfProducts = productKeys
        .map(getProduct)
        .filter(product => product && product.type === 'pdf');

      if (customerEmail && pdfProducts.length) {
        await sendPdfEmail({ to: customerEmail, products: pdfProducts, sessionId: session.id });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Webhook processing failed.' });
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
