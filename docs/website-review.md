# Website updates — 2026-09-11

## Implemented

- Homepage KakaoTalk now links to the direct chat already used by the floating contact button.
- All 18 pages and both shared HTML partials were checked for English/Korean coverage. Missing Korean content and 91 editorial corrections were applied; titles, descriptions, accessible labels, reference-link labels, dates and dynamic checkout/cart/status messages now support both languages. Korean is the initial rendered language; English remains selectable and remembered. Product brands and citation destinations are preserved. Translations do not constitute a new medical or scientific review of the source articles.
- Six coaching package enquiry links preserve the chosen package in the contact form. One start-timing selector replaces the overlapping financial-readiness and hiring-stage questions.
- Coaching duration consistently uses four-week blocks, following the existing package cards. Session bundles still use session counts. Prepayment discounts remain 5% for 6–11 blocks and 10% for 12–14; the legacy `months` API/storage key is retained for compatibility but represents four-week units in this interface. Existing contracts and past purchases are not migrated.
- Fixed the cart migration that overwrote prepaid totals with the single-block price. Checkout continues to calculate prices from the server catalog and now rejects fractional/out-of-range quantities and session-bundle duration discounts.
- Cart goes directly to checkout. The detailed coaching intake appears after server-confirmed payment for coaching or mixed purchases and ends with an acknowledgement rather than another payment redirect. The cart is only cleared after payment verification. Opening the success page without a valid session no longer claims payment succeeded.
- Checkout locale and delivery-email language follow the selected website language. English PDF attachments are explicitly identified as English; no Korean PDF SKU is enabled.
- Reduced-motion mode stops the text/photo tickers, animated pointer and smooth navigation.
- The homepage foregrounds the coach's existing experience and offers a direct coaching enquiry. The offer is presented as an enquiry until its detailed terms are supplied.

## Content still requiring the owner’s facts

1. Confirm whether the founding offer is up to three paid four-week blocks plus three free blocks, or three blocks total; confirm eligibility and current availability. The draft intentionally does not state an unverified discount example or apply a new promotion in checkout.
2. Identify the existing transformation image's subject, timeframe and accurate attribution. Its current alt text is neutral. No fabricated client case study was added to the homepage.
3. Supply approved client testimonials, attribution and publication permission. The homepage uses the existing coach biography instead of invented testimonials.

These are missing content facts, not an additional deployment-approval requirement.

## Verification

Run `npm ci` followed by `npm test` with Node.js 22.13+ (24 LTS recommended). Tests use a simulated DOM and mocked payment/email providers; they make no live payments or email submissions. Coverage includes every rendered page's language toggle, all six package selections, cart discount persistence, payment summary localization, confirmed/unconfirmed payment states, mixed purchase onboarding, local links/assets, server pricing, unsupported Korean variants, email language and the contact spam field.

Live desktop/mobile rendering and real Stripe/Resend delivery remain unverified: the browser reported that its admin-enforced security check was unavailable. Do not treat simulated DOM tests as visual or live-service verification.

## PDF workstream

See [PDF assessment and workflow](pdf-localization/README.md). All five English sources were inventoried (509 pages); no Korean PDFs were created. The separate VS Code workspace contains a page tracker, proposed glossary and QA tools. Source repair and coach/bilingual review precede release.
