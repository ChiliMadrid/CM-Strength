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
- `RESEND_FROM_EMAIL`: Verified sender, for example `CM Strength <programs@yourdomain.com>`.
- `SITE_OWNER_EMAIL`: Optional BCC/admin copy email. Defaults to `coach.cmstrength@gmail.com` in the webhook code.

Stripe webhook endpoint:

`https://your-domain.com/api/stripe-webhook`

Listen for:

- `checkout.session.completed`

PDF files are stored under `api/_private/EnglishPDF` so the browser does not receive a public download path. The webhook emails purchased PDFs only after Stripe confirms payment.
