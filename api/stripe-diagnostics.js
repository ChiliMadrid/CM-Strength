module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || '';

  return res.status(200).json({
    stripe_key_mode: stripeKey.startsWith('sk_live_') ? 'live' : stripeKey.startsWith('sk_test_') ? 'test' : 'missing_or_unknown',
    stripe_secret_key_configured: Boolean(process.env.STRIPE_SECRET_KEY),
    stripe_webhook_secret_configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    resend_api_key_configured: Boolean(process.env.RESEND_API_KEY),
    resend_from_email_configured: Boolean(process.env.RESEND_FROM_EMAIL),
    resend_reply_to_email_configured: Boolean(process.env.RESEND_REPLY_TO_EMAIL),
    site_owner_email_configured: Boolean(process.env.SITE_OWNER_EMAIL)
  });
};
