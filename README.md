# CM Strength Website

New design for the coaching site.

Refactored static site structure:

- `home.html`
- `aboutme.html`
- `coaching.html`
- `pdf-programs.html`
- `blog.html`
- `cart.html`
- `contact.html`
- `css/style.css`
- `js/main.js`
- `partials/header.html`
- `partials/footer.html`
- `assets/` for the logo and future site photos

Upload the brand logo as `assets/logo.png`; the header will use it automatically and fall back to the CM text mark if it is missing.

Run the site from a local web server so the shared partials can load with `fetch`.

## Stripe + Vercel setup

The site uses Vercel Serverless Functions for Stripe Checkout and PDF delivery.

Required Vercel environment variables:

- `STRIPE_SECRET_KEY`: Stripe secret key.
- `STRIPE_WEBHOOK_SECRET`: Signing secret for the Stripe webhook endpoint.
- `RESEND_API_KEY`: Resend API key for PDF email delivery.
- `RESEND_FROM_EMAIL`: Verified Resend sender, for example `CM Strength <programs@yourdomain.com>`. Do not use a Gmail address here unless Resend explicitly verifies it as a sender.
- `RESEND_REPLY_TO_EMAIL`: Optional reply-to email. Defaults to `SITE_OWNER_EMAIL`, then `coach.cmstrength@gmail.com`.
- `SITE_OWNER_EMAIL`: Optional BCC/admin copy email. Defaults to `coach.cmstrength@gmail.com` in the webhook code.

Stripe webhook endpoint:

`https://your-domain.com/api/stripe-webhook`

Listen for:

- `checkout.session.completed`

PDF files are stored under `api/_private/EnglishPDF` so the browser does not receive a public download path. The webhook emails purchased PDFs only after Stripe confirms payment.

The success page also calls `/api/fulfill-checkout-session` with Stripe's `session_id` after redirect. That endpoint retrieves the Checkout Session from Stripe, verifies `payment_status=paid`, and sends the same PDF email as a fallback. Resend idempotency prevents duplicate delivery when both the webhook and success page run.
