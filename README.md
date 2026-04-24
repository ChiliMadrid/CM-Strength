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
