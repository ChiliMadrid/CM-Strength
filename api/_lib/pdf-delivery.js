const fs = require('fs');
const { getProduct, getPdfPath } = require('./products');

const OWNER_EMAIL = process.env.SITE_OWNER_EMAIL || 'coach.cmstrength@gmail.com';
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || OWNER_EMAIL;

function getPurchasedPdfProducts(session) {
  const productKeys = String(session.metadata?.product_keys || '')
    .split(',')
    .map(key => key.trim())
    .filter(Boolean);

  return productKeys
    .map(getProduct)
    .filter(product => product && product.type === 'pdf');
}

async function sendPdfEmail({ to, products, sessionId }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error('PDF email delivery is not configured.');
  }

  const attachments = products.map(product => {
    const filePath = getPdfPath(product);
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`PDF file is missing for ${product.name}.`);
    }

    return {
      filename: product.filename,
      content: fs.readFileSync(filePath).toString('base64')
    };
  });

  if (!attachments.length) {
    throw new Error('No PDF attachments were generated.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `cm-strength-pdf-${sessionId}`
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      bcc: [OWNER_EMAIL],
      reply_to: REPLY_TO_EMAIL,
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

async function deliverSessionPdfs(session) {
  const customerEmail = session.customer_details?.email || session.customer_email;
  const pdfProducts = getPurchasedPdfProducts(session);

  if (!pdfProducts.length) {
    return { delivered: false, reason: 'no_pdf_products' };
  }

  if (!customerEmail) {
    throw new Error('Checkout session does not include a customer email.');
  }

  await sendPdfEmail({
    to: customerEmail,
    products: pdfProducts,
    sessionId: session.id
  });

  return { delivered: true, count: pdfProducts.length, email: customerEmail };
}

module.exports = {
  deliverSessionPdfs,
  getPurchasedPdfProducts,
  sendPdfEmail
};
