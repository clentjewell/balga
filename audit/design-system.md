# Design System — Balga Designs

All values extracted from the live site's computed styles and the Elementor
global palette (not eyeballed). See `design-tokens.json` for the machine copy.

## Typography

- **Font family:** `Montserrat, sans-serif` everywhere (self-hosted by
  WordPress from Google Fonts; weights 100–900 loaded, 400/500/600 used).
- **Body:** 16px / 400 / line-height 28.8px (1.8) / colour `#6B847A`.
- **H1 (hero):** 70px / 600 / 84px, colour `#FEFEFC` (white over green). Scales
  down fluidly on smaller viewports.
- **H2:** 47px / 600 / 61.1px, colour `#1B1B1B`.
- **H3:** 25px / 600 / 32.5px, colour `#1B1B1B`.
- **H4 / footer headings:** 21px / 600 (footer headings render white).
- **Eyebrow / label:** 16px / 600, letter-spacing **5px**, UPPERCASE, colour
  `#B7B597` (khaki accent).
- **Nav links:** 16px / 400, colour `#5A674E`.

## Colour palette

| Token | Hex | Use |
|-------|-----|-----|
| primary | `#1B1B1B` | headings, dark text |
| secondary | `#5A674E` | brand green — footer, dark blocks, buttons |
| text | `#6B847A` | sage body text |
| accent | `#B7B597` | eyebrows, dividers, small accents |
| mint | `#DDEBEA` | alternating section background |
| sand | `#DAD3BE` | alternating section background / stat block |
| hero | `#939B8A` | hero background green |
| card | `#A7A489` | service-card khaki |
| white | `#FEFEFC` | hero heading / on-dark text |
| background | `#FFFDFB` | page background (warm off-white) |

## Layout & spacing

- Boxed **container width 1140px**; Elementor responsive breakpoints at 1024px
  and 767px.
- Generous vertical section rhythm (~80–120px top/bottom on desktop).
- Grids: services 3×2, pricing 4-up (2-up tablet, 1-up mobile), footer 4-col →
  1-col on mobile.

## Components & interactions

- **Buttons:** two families — square Elementor buttons (`border-radius:0`,
  padding `15px 20px`, weight 500) and **pill** CTAs ("Contact Us", "Start Your
  Project", "Play Video") with rounded-full shape; hero pills are white outline,
  light-section pills are solid green.
- **Header:** transparent, overlays hero; horizontal nav revealed with a
  fadeInUp entrance; hamburger + slide-in panel under 1024px (Esc / click-out /
  body-scroll-lock).
- **Cards:** flat, `border-radius:0`; service cards use a khaki fill with the
  image top-cropped (`object-fit:cover`).
- **Before/After:** ElementsKit image-comparison — draggable vertical divider,
  labels "Before"/"After", initial offset **0.5** (50%). Pairs can differ in
  native aspect ratio, so a fixed-ratio container + `object-fit:cover` keeps
  them aligned.
- **Testimonials:** Swiper carousel, 1 slide/view, autoplay, 5-star icons above
  each quote (reviews are unattributed except one signed "Chrystal").
- **FAQ:** single-open accordion (ElementsKit card).
- **Counters:** count-up animation on scroll — final values 14+, 1.2K+, 85+,
  210+.
- **Video:** "Play Video" opens a modal playing YouTube `amTZybcbAGE`.
- **Entrance animations:** subtle fadeInUp; all gated behind
  `prefers-reduced-motion`.

## Imagery

- Photographs are full-bleed with `object-fit:cover`; focal points preserved via
  `object-position`.
- Logo: white PNG with tagline (1144×406) with transparency preserved; emblem
  mark used as a secondary mark.
- Decorative hand-drawn icons (watering can, plant, etc.) in yellow/olive for
  feature and process sections.
