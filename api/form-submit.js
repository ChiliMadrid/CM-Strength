const OWNER_EMAIL = process.env.SITE_OWNER_EMAIL || 'coach.cmstrength@gmail.com';
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || OWNER_EMAIL;

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  const text = String(req.body || '');
  const contentType = String(req.headers['content-type'] || '');
  if (contentType.includes('application/json')) return JSON.parse(text || '{}');
  if (contentType.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(text));
  return {};
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeFields(fields) {
  const entries = Object.entries(fields || {})
    .map(([key, value]) => [String(key || '').trim(), String(value || '').trim()])
    .filter(([key]) => key && key !== 'formType' && key !== 'company');
  return Object.fromEntries(entries.slice(0, 80));
}

function buildEmail({ formType, fields }) {
  const isIntake = formType === 'intake';
  const name = fields.name || fields['Legal Name'] || fields['Full Name'] || 'Website visitor';
  const email = fields.email || fields['Primary Email'] || '';
  const title = isIntake ? 'CM Strength client intake form' : 'CM Strength coaching inquiry';
  const rows = Object.entries(fields)
    .map(([key, value]) => `
      <tr>
        <th align="left" style="vertical-align:top;padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(key)}</th>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;white-space:pre-wrap;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');

  return {
    subject: `${title}: ${name}`,
    replyTo: email || REPLY_TO_EMAIL,
    html: `
      <h2>${escapeHtml(title)}</h2>
      <p>Submitted from cmstrength.cc.</p>
      <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;max-width:760px;">
        ${rows}
      </table>
    `
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return res.status(500).json({ error: 'Contact form delivery is not configured.' });
  }

  try {
    const body = parseBody(req);
    if (body.company) return res.status(200).json({ ok: true });

    const formType = String(body.formType || body.type || '').trim();
    if (!['contact', 'intake'].includes(formType)) return res.status(400).json({ error: 'Unknown form type.' });

    const fields = normalizeFields(body.fields || body);
    const email = fields.email || fields['Primary Email'];
    if (!email || !String(email).includes('@')) return res.status(400).json({ error: 'A valid email is required.' });

    const { subject, replyTo, html } = buildEmail({ formType, fields });
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [OWNER_EMAIL],
        reply_to: replyTo,
        subject,
        html
      })
    });

    if (!response.ok) throw new Error(`Resend form email failed: ${await response.text()}`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Form submission failed:', error);
    return res.status(500).json({ error: 'Unable to send the form right now.' });
  }
};
