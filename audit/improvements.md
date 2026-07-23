# Corrections & Improvements

Only fixes permitted by the brief (broken responsiveness, a11y, broken links,
layout shift, focus, image loading, invalid HTML, broken interactions). No text,
pricing, testimonials, dates or branding were changed.

## Inspection method note

Headless Chromium could not reach the public origin directly — the session's
network egress proxy resets the browser's TLS handshake (ECH/SNI inspection),
though plain HTTP fetches succeed. So the site was **mirrored over HTTP**
(HTML + every stylesheet, font and image) and rendered from `localhost`, giving
real computed styles and screenshots. JS-driven Elementor widgets (counters,
ElementsKit image-comparison, testimonial Swiper) do not initialise in the
static mirror, so their content/behaviour was reconstructed from the raw markup
+ downloaded assets and verified against the live image files.

## Accessibility

- Added a visible **skip-to-content** link and proper landmarks
  (`header/nav/main/section/article/footer`).
- Real `<label>`s for every contact field; `aria-invalid` + inline error text;
  focus moves to the first invalid field.
- Before/after slider is a keyboard-operable `role="slider"` with arrow-key
  control, `aria-valuenow`, and a visible focus ring.
- FAQ accordion uses `<button aria-expanded>` + `aria-controls`; mobile menu
  traps focus, closes on Esc / click-outside, and locks body scroll.
- Visible focus states restored site-wide (the live theme suppressed them).

## Responsiveness / layout shift

- Native aspect ratios inside a before/after pair differ (e.g. 16:9 vs 4:3); the
  rebuilt slider uses a fixed-ratio container + `object-fit:cover` so the two
  images stay perfectly aligned with no jump.
- Every `<img>` carries explicit `width`/`height` (from `asset-dimensions.json`)
  to prevent CLS; below-the-fold images are `loading="lazy"`.

## Performance / correctness

- Removed WordPress/Elementor/jQuery/analytics payloads entirely; ships only
  small vanilla JS for the interactive pieces.
- Self-hosted **Montserrat** (woff2 subset) — no third-party font requests.
- Original media downloaded, de-duplicated and re-encoded (quality ≥ 82,
  transparency preserved) — no hotlinking to WordPress.
- Internal links point at the rebuilt routes; the WordPress AJAX contact
  endpoint is replaced with a Worker `/api/contact` endpoint.

## Motion

- All entrance animations, the counter count-up and carousel autoplay are gated
  behind `prefers-reduced-motion: reduce`.
