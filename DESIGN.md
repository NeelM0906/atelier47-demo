# Atelier47 design reference

The design goal is quiet confidence. The site should feel like the inside of a good atelier: daylight, linen, one lamp, and nothing shouting. Most Diamond District sites do the opposite with banners, timers, and stacked popups. This template proves restraint converts better when the proof is strong.

## Rules that hold everywhere

- No popups, modals, marquees, countdown timers, sticky chat bubbles, or discount banners.
- One primary action per screen. The primary action is almost always **Book a consultation**.
- Every claim has a name or a number next to it: a person, a price, a week count, a lab.
- Illustrations sit on a linen field with a soft radial light. They never sit on pure white.
- Motion is a slow fade and 14 pixel rise on first view, 1.1 seconds. It turns off under `prefers-reduced-motion`.

## Color tokens

Colors are set in `site.config.json` under `colors` and written to `assets/css/tokens.css` as CSS custom properties.

| Token | Value | Use |
| --- | --- | --- |
| `--ivory` | `#F7F3EC` | Page background. |
| `--paper` | `#FBF9F5` | Raised surfaces, tinted sections, inputs. |
| `--linen` | `#EFE8DC` | Illustration fields and map ground. |
| `--ink` | `#1F1D1A` | Text, primary buttons, footer and booking band. |
| `--graphite` | `#4A4640` | Body copy on long passages and secondary text. |
| `--muted` | `#6B655C` | Captions, hints, and metadata. |
| `--champagne` | `#C9B48A` | Underlines, rules, and accents on dark backgrounds only. |
| `--champagne-deep` | `#7A5F33` | Eyebrows, step numbers, and accents on light backgrounds. |
| `--line` | `#DDD3C2` | Hairlines and borders. |

Error text uses `#9B2C2C`.

### Contrast

Measured with the WCAG 2 relative luminance formula. Every text pairing in use passes AA for normal text (4.5 to 1).

| Foreground | Ivory | Paper | Linen |
| --- | --- | --- | --- |
| Ink | 15.20 | 15.99 | 13.81 |
| Graphite | 8.47 | 8.91 | 7.69 |
| Muted | 5.21 | 5.48 | 4.74 |
| Champagne deep | 5.41 | 5.69 | 4.91 |

On ink: paper 15.99, champagne 8.31, footer text `#D9D2C6` 11.20, footer base text `#B9B1A4` 7.92. Champagne on ivory is about 2 to 1, so it never carries text on light backgrounds.

## Type

| Role | Family | Weight | Size |
| --- | --- | --- | --- |
| Display (`.display`) | Newsreader | 300 | `clamp(2.75rem, 2rem + 4vw, 5.25rem)` |
| Hero title | Newsreader | 300, italic second line | `clamp(3rem, 2rem + 4.6vw, 6.25rem)` |
| Section title (`.display-2`) | Newsreader | 300 | `--step-4` |
| Card and step title (`.display-3`) | Newsreader | 400 | `--step-2` |
| Body | Geist | 400 | `--step-0`, 16 to 17 pixels, line height 1.65 |
| Eyebrow (`.eyebrow`) | Geist | 500 | 12 pixels, uppercase, 0.18em tracking |

Newsreader is pinned to the 36 point optical size, weights 300 to 500. Geist is limited to weights 300 to 600. Both are subset to Latin and served as WOFF2 from `assets/fonts/`, about 120 KB in total.

### Type scale

| Token | Value |
| --- | --- |
| `--step--1` | `clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)` |
| `--step-0` | `clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)` |
| `--step-1` | `clamp(1.125rem, 1.08rem + 0.25vw, 1.25rem)` |
| `--step-2` | `clamp(1.375rem, 1.25rem + 0.6vw, 1.75rem)` |
| `--step-3` | `clamp(1.75rem, 1.5rem + 1.2vw, 2.5rem)` |
| `--step-4` | `clamp(2.25rem, 1.8rem + 2.4vw, 3.75rem)` |
| `--step-5` | `clamp(2.75rem, 2rem + 4vw, 5.25rem)` |

## Space and layout

| Token | Value | Use |
| --- | --- | --- |
| `--space-section` | `clamp(4.5rem, 3rem + 7vw, 9.5rem)` | Vertical padding of every major section. |
| `--gutter` | `clamp(1.25rem, 0.8rem + 2.4vw, 3rem)` | Page side padding. |
| `--radius` | `2px` | Buttons, inputs, cards. Corners stay nearly square on purpose. |
| `.wrap` | max 1320 pixels, 1480 above 1700 pixels | Content width. |
| `.narrow` | children max 54rem | Long-form text and single forms, left aligned with the grid. |

Breakpoints are 560, 860, and 1080 pixels. Below 1080 the navigation moves into a menu button. Below 860 two-column layouts stack, and the ring preview becomes a compact sticky bar above the builder steps.

## Components

- **Buttons.** `.btn-primary` is ink on paper text. `.btn-ghost` is a 1 pixel ink outline. `.btn-light` and `.btn-ghost-light` are for the ink booking band. Minimum height is 48 pixels.
- **Choice chips.** Native radio inputs under a styled face, so the keyboard, screen readers, and form validation all work without extra code. The checked state is ink fill. Shape chips use a 1 pixel inset ring instead, so the shape drawing stays visible.
- **Piece card.** A square linen field with the illustration at 78 percent width, title in Newsreader, two lines of metadata, and a round save button in the corner.
- **Error summary.** A bordered panel at the top of the form that takes focus and links to each invalid field. Each field also shows its own message below the input.
- **Success panel.** Replaces the form in place, takes focus, and shows a reference number.

## Illustrations

`assets/js/jewelry.js` draws every ring, band, pendant, earring, and loose stone as SVG from four registries: `SHAPES`, `METALS`, `STYLES`, and `STONES`. Each shape is a polygon outline. Brilliant cuts get crown and star facets shaded by angle to a light at the upper left. Step cuts get concentric rings with corner lines. Metals are five-stop linear gradients. Every SVG has a `title` and an `aria-label` that describe the piece in words.

When real photography arrives, keep the same field: a linen or warm grey backdrop, soft light from the upper left, the piece centered at about 80 percent of the frame.
