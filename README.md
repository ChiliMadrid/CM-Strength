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

- `SITE_URL`: Production site origin, for example `https://cmstrength.cc`. Checkout success and cancel URLs use this value.
- `STRIPE_SECRET_KEY`: Stripe secret key.
- `STRIPE_WEBHOOK_SECRET`: Signing secret for the Stripe webhook endpoint.
- `RESEND_API_KEY`: Resend API key for PDF email delivery.
- `RESEND_FROM_EMAIL`: Verified Resend sender, for example `CM Strength <programs@yourdomain.com>`. Do not use a Gmail address here unless Resend explicitly verifies it as a sender.
  In the Vercel dashboard, enter this value without wrapping quotes.
- `RESEND_REPLY_TO_EMAIL`: Optional reply-to email. Defaults to `SITE_OWNER_EMAIL`, then `coach.cmstrength@gmail.com`.
- `SITE_OWNER_EMAIL`: Optional BCC/admin copy email. Defaults to `coach.cmstrength@gmail.com` in the webhook code.

Stripe webhook endpoint:

`https://your-domain.com/api/stripe-webhook`

Listen for:

- `checkout.session.completed`

PDF files are stored under `api/_private/EnglishPDF` so the browser does not receive a public download path. The webhook emails purchased PDFs only after Stripe confirms payment.

The success page also calls `/api/fulfill-checkout-session` with Stripe's `session_id` after redirect. That endpoint retrieves the Checkout Session from Stripe, verifies `payment_status=paid`, and sends the same PDF email as a fallback. Resend idempotency prevents duplicate delivery when both the webhook and success page run.

## Local checks and localization

Run `npm ci` and `npm test` with Node.js 22.13+ (24 LTS recommended). The tests use a simulated DOM and mocked external providers; they do not send email or make purchases.

Visitor-facing HTML uses `data-en` and `data-ko`, with Korean as the static default. Add both translations when changing copy. Use `data-alt-en`/`data-alt-ko`, `data-aria-label-en`/`data-aria-label-ko`, and `data-content-en`/`data-content-ko` for translated attributes. Dynamic messages must update on `languagechange`.

Coaching prices are per four-week block. The legacy `months` field in cart storage and checkout requests counts these blocks. Do not change pricing or session counts while translating copy.

See `docs/website-review.md` for implemented changes and pending content facts, and `docs/pdf-localization/README.md` for the Korean PDF workflow.
