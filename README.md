# Atelier47 website template

Atelier47 is a static website template for an independent custom jewelry atelier, the kind found upstairs on West 47th Street. It sells one thing: a booked consultation. Every page leads to the 60 minute design appointment, and the site earns trust with named makers, a written process, listed service prices, and plain education about diamonds.

Everything on the demo site is fictional. The business, address, team, commissions, prices, and reviews are placeholders. The jewelry images are SVG illustrations drawn in code.

The site has no popups, no marquees, no countdown timers, no chat widgets, no cookies, and no third-party requests.

## View the site

The built HTML is already in this folder. No build step is needed to view it.

1. Start a local server in this folder:

	```sh
	python3 scripts/serve.py 8000
	```

	This server gzips text the way Netlify and Vercel do. `python3 -m http.server 8000` also works.

2. Open `http://localhost:8000/`.

You can also open `index.html` directly from disk. Every link is relative and every script is a classic script, so pages, forms, and the ring builder work over `file://`. Chrome blocks web fonts over `file://`, though, so the type falls back to Georgia and the system sans. Use a local server to see the real design.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Home: hero, standards strip, five-step process, featured commissions, materials, reviews, visit and book. |
| `collections.html` | Portfolio of past commissions with filters for piece, shape, metal, style, and budget. Filters are kept in the URL. |
| `work/<id>.html` | One page per commission with specs, story, a save button, a WhatsApp link with the piece prefilled, and related work. |
| `design.html` | Design your ring: shape, carat, origin, metal, setting, budget, timeline, and ring size, with a live SVG preview and an illustrative price range. Ends in a consultation request. |
| `education.html` | Interactive 4Cs explorer, color, clarity and carat scales, nine shapes, diamond anatomy, lab-grown versus natural, GIA and IGI, and responsible sourcing. |
| `process.html` | The five-phase, six-step timeline with week ranges, a timeline chart, and the payment schedule. |
| `book.html` | Consultation booking: type, in person or video, calendar, time slots, details, and retainer terms. Writes a calendar file on success. |
| `services.html` | Cleaning, resizing, repair, appraisal, and redesign with prices, plus an appraisal and repair inquiry form with photo upload. |
| `about.html` | The five named makers. |
| `faq.html` | Grouped questions with `FAQPage` structured data. |
| `contact.html` | Address, building entry steps, transit, hours, a schematic map, and a contact form. |
| `legal.html` | Demo disclosure, privacy, terms, and accessibility statement. |
| `saved.html` | Pieces the visitor saved on this device. |
| `404.html` | Not found page. Uses root-absolute links because hosts serve it at any path. |

## Rebrand the template

All brand values live in `site.config.json`. Content lives in `content/`. The HTML is generated from both by `scripts/build.js`, which needs Node 18 or later and has no dependencies.

1. Edit `site.config.json`. The table below lists the fields.
2. Edit the files in `content/` for commissions, process steps, services, FAQ, and reviews.
3. Rebuild:

	```sh
	node scripts/build.js
	```

4. Regenerate the social share image and the touch icon. This step needs Playwright for Python and a Chrome binary:

	```sh
	pip install playwright
	python3 scripts/render_images.py
	```

5. Replace the placeholder portraits on the About page with real photographs. Swap the `teamPortrait` SVG in `scripts/pages.js` for an `<img>` tag.
6. Set `"demo": false` in `site.config.json` to remove every demo disclosure label.

`build.js` stops with a list of errors if a commission uses an unknown shape, metal, style, stone, category, or budget.

### Fields in `site.config.json`

| Field | What it controls |
| --- | --- |
| `demo` | Shows demo disclosure labels in the footer, on reviews, on the portfolio, and on the legal page. |
| `brand.name`, `brand.tagline`, `brand.shortDescription` | Logo text, page titles, meta descriptions, and structured data. |
| `brand.founded`, `brand.legalName` | Hero line, About page, and footer copyright. |
| `site.baseUrl` | Canonical URLs, Open Graph URLs, `sitemap.xml`, and `robots.txt`. Set it to the live domain before you deploy. |
| `colors.*` | Design tokens. `build.js` writes them to `assets/css/tokens.css`. See `DESIGN.md` for the contrast rules. |
| `contact.*` | Phone, email, WhatsApp number in international format without `+`, address, coordinates, entry note, transit, social links, and hours. |
| `contact.hours[]` | One entry per group of days. `days` uses schema.org two-letter codes. Add `"closed": true` for a closed day. Hours drive the footer, the hours tables, the structured data, and which booking days and slots are open. |
| `consultation.*` | Retainer amount and copy, refund copy, durations, slot start times, how many days ahead booking opens (`leadDays`), how far ahead it reaches (`windowDays`), and consultation types. |
| `endpoints.*` | Where forms send data. See the next section. |
| `pricingGuide.*` | The illustrative range on Design your ring. Set `enabled` to `false` to hide it. Stone cost is `perCaratAt1 * carat ^ exponent`, plus a setting cost and a metal surcharge, shown as a range of plus or minus `spread`. |
| `team[]` | Names, roles, credentials, years, and bios on the About page. |

### Content files

| File | Shape |
| --- | --- |
| `content/commissions.json` | `id`, `title`, `category` (`ring`, `band`, `pendant`, `earrings`), `shape`, optional `sideShape`, `metal` (`platinum`, `white`, `yellow`, `rose`), `style`, `carat`, `origin` (`natural`, `lab`), `stone` (`diamond`, `sapphire`, `emerald`, `morganite`), `budget` (`under-10k`, `10-25k`, `25-50k`, `50k-plus`), `year`, `weeks`, `featured`, `client`, `summary`, `story`, `details[]`. The first six with `featured: true` appear on the home page. |
| `content/process.json` | Phases, each with `steps[]` of `title`, `when`, `detail`, and `weeks` as `[start, end]`. The home page shows phases. The process page shows steps. |
| `content/services.json` | `id`, `title`, `price`, `turnaround`, `detail`. The `id` values also fill the service select on the inquiry form. |
| `content/faq.json` | Groups of `q` and `a`. |
| `content/testimonials.json` | `quote`, `name`, `context`. Replace with verified reviews before launch. |

Shapes, metals, styles, and stones are defined once in `assets/js/jewelry.js`. The same file draws every illustration, both at build time in Node and live in the browser.

## Connect forms and bookings

The site has four forms: `booking`, `inquiry` (Design your ring), `service`, and `contact`. With an empty endpoint, a form saves its submission to the visitor's `localStorage` under `a47.submissions` and shows the success state. That is the demo behavior.

To send submissions to a real backend, set the endpoint URL for the form in `site.config.json`, then rebuild:

```json
"endpoints": {
	"booking": "https://example.com/api/bookings",
	"inquiry": "https://formspree.io/f/your-id",
	"service": "https://formspree.io/f/your-id",
	"contact": "https://formspree.io/f/your-id"
}
```

`assets/js/site.js` sends a `POST` with a JSON body of this shape:

```json
{
	"kind": "booking",
	"ref": "A47-BK-1A2B3C4",
	"at": "2026-11-09T20:59:03.802Z",
	"payload": {
		"type": "engagement",
		"mode": "in-person",
		"date": "2026-11-10",
		"time": "10:00",
		"name": "…",
		"email": "…",
		"phone": "…",
		"retainerAck": "yes",
		"durationMinutes": 60,
		"timezone": "America/New_York"
	}
}
```

Any `2xx` response shows the success state. Any other response shows an error with the studio phone number, and the visitor's input stays in the form.

Formspree, Basin, Netlify Forms with a small function, a Zapier webhook, or your own API all accept this. File inputs send file names and sizes only. To receive the photos themselves, post `multipart/form-data` from the `service` form instead, or use a form service that hosts uploads.

### Take the retainer

The booking page tells the visitor that a secure payment link follows by email. The simplest setup is a Stripe Payment Link for the retainer amount, sent with the confirmation. To collect payment at booking instead, redirect to the Payment Link inside the `a47:success` handler in `assets/js/booking.js`.

### Use a real calendar

Open times come from `consultation.slotTimes` and `contact.hours`. In demo mode, slots that this browser already booked show as taken. To show real availability, fetch busy slots from your calendar API in `taken()` in `assets/js/booking.js`, or replace the booking form with a Cal.com or Calendly embed and keep the rest of the page.

## Deploy

The site is plain files. Upload the folder as it is. Set `site.baseUrl` to the live domain and rebuild first.

- **Netlify.** Drag the folder onto the Netlify dashboard, or run `npx netlify deploy --prod --dir .`. Netlify serves `404.html` for missing pages automatically.
- **Vercel.** Run `npx vercel --prod` in this folder. Choose **Other** as the framework and leave the build command empty.
- **GitHub Pages.** Push the folder to a repository, then turn on Pages for the branch root under **Settings**, **Pages**. If the site lives under a subpath such as `/atelier47/`, every page still works because links are relative. Only `404.html` uses root links, so edit its two links for a subpath.

Exclude `scripts/`, `content/`, and `screenshots/` from the upload if you prefer. The live site does not read them.

## Verify a change

`scripts/verify.py` serves the site and drives headless Chrome through it. It needs Playwright for Python and Chrome. For accessibility checks it also needs `axe-core` from npm.

```sh
pip install playwright
npm install axe-core
AXE_PATH=node_modules/axe-core/axe.min.js python3 scripts/verify.py
```

It checks every local link and anchor, records console errors and failed requests, runs the filters, wishlist, ring builder, booking, calendar file, service and contact forms, keyboard skip link, mobile menu, reduced motion and no-JavaScript reading, runs axe-core for WCAG 2.2 AA, and captures full-page screenshots into `screenshots/` at 375, 768, 1280, and 1920 pixels wide. It writes `screenshots/report.json` and exits non-zero on any failure. The latest run is summarized in `verification/report.md`. Add `--no-shots` to skip screenshots.

The checks also cover SEO meta, Open Graph, canonical links, JSON-LD parsing on every page, and horizontal overflow at every captured width.

To run Lighthouse on six key pages in both mobile and desktop presets:

```sh
npm install lighthouse
LIGHTHOUSE=node_modules/.bin/lighthouse scripts/lighthouse.sh
```

Scores print as a table and are saved to `verification/lighthouse/summary.json` and `verification/lighthouse/summary.md`.

## Files

| Path | Role |
| --- | --- |
| `site.config.json` | Brand, contact, booking, pricing guide, and team. |
| `content/*.json` | Commissions, process, services, FAQ, and reviews. |
| `scripts/build.js` | Validates content and writes the layout, `tokens.css`, `data.js`, `sitemap.xml`, `robots.txt`, `site.webmanifest`, and `favicon.svg`. |
| `scripts/pages.js` | Page templates. |
| `scripts/render_images.py` | Renders `og-image.png` and `apple-touch-icon.png`. |
| `scripts/serve.py` | Local static server with gzip, used by the Lighthouse script. |
| `scripts/verify.py` | End-to-end checks and screenshots. |
| `scripts/lighthouse.sh` | Lighthouse on six pages, mobile and desktop, into `verification/lighthouse/`. |
| `assets/js/jewelry.js` | Shape, metal, style, and stone registry, SVG renderer, 4Cs renderer, and price estimate. |
| `assets/js/site.js` | Navigation, scroll reveals, saved pieces, form validation, and the submit adapter. |
| `assets/js/builder.js`, `booking.js`, `collections.js`, `education.js`, `saved.js` | Page behavior. |
| `assets/css/site.css` | All styles. Tokens come from `tokens.css`. |
| `assets/fonts/` | Newsreader and Geist, subset to Latin, self-hosted as WOFF2. Both are licensed under the SIL Open Font License 1.1. See `assets/fonts/LICENSE.txt`. |
