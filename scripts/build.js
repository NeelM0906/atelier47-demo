#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const J = require(path.join(ROOT, 'assets/js/jewelry.js'));

const config = read('site.config.json');
const content = {
  commissions: read('content/commissions.json'),
  process: read('content/process.json'),
  testimonials: read('content/testimonials.json'),
  services: read('content/services.json'),
  faq: read('content/faq.json')
};

const BUDGETS = { 'under-10k': 'Under $10,000', '10-25k': '$10,000 to $25,000', '25-50k': '$25,000 to $50,000', '50k-plus': '$50,000 and above' };

validate(config, content);

const pages = require('./pages.js')({ config, content, J, h: helpers() });

const written = [];
function write(rel, data) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  written.push(rel);
}

fs.rmSync(path.join(ROOT, 'work'), { recursive: true, force: true });
for (const page of pages.list) write(page.path, layout(page));
write('assets/css/tokens.css', tokens());
write('assets/js/data.js', dataScript());
write('sitemap.xml', sitemap());
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${config.site.baseUrl}/sitemap.xml\n`);
write('site.webmanifest', JSON.stringify({ name: config.brand.name, short_name: config.brand.name, start_url: './index.html', display: 'standalone', background_color: config.colors.ivory, theme_color: config.site.themeColor, icons: [{ src: 'assets/img/favicon.svg', sizes: 'any', type: 'image/svg+xml' }, { src: 'assets/img/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] }, null, 2));
write('assets/img/favicon.svg', favicon());
console.log(`Built ${written.length} files for ${config.brand.name}`);

function validate(cfg, c) {
  const errors = [];
  const ids = new Set();
  for (const p of c.commissions) {
    if (ids.has(p.id)) errors.push(`duplicate commission id ${p.id}`);
    ids.add(p.id);
    if (!J.SHAPES[p.shape]) errors.push(`${p.id}: unknown shape ${p.shape}`);
    if (p.sideShape && !J.SHAPES[p.sideShape]) errors.push(`${p.id}: unknown sideShape ${p.sideShape}`);
    if (!J.METALS[p.metal]) errors.push(`${p.id}: unknown metal ${p.metal}`);
    if (!J.STYLES[p.style]) errors.push(`${p.id}: unknown style ${p.style}`);
    if (!J.STONES[p.stone]) errors.push(`${p.id}: unknown stone ${p.stone}`);
    if (!J.CATEGORIES[p.category]) errors.push(`${p.id}: unknown category ${p.category}`);
    if (!BUDGETS[p.budget]) errors.push(`${p.id}: unknown budget ${p.budget}`);
  }
  for (const k of ['name', 'tagline']) if (!cfg.brand[k]) errors.push(`brand.${k} missing`);
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
}

function helpers() {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const money = (n) => '$' + Number(n).toLocaleString('en-US');
  const time12 = (t) => { const [hh, mm] = t.split(':').map(Number); const ap = hh >= 12 ? 'pm' : 'am'; const h12 = ((hh + 11) % 12) + 1; return mm ? `${h12}:${String(mm).padStart(2, '0')} ${ap}` : `${h12} ${ap}`; };
  return { esc, money, time12, BUDGETS };
}

function layout(page) {
  const { esc } = helpers();
  const depth = page.path.split('/').length - 1;
  const R = page.absolute ? '/' : '../'.repeat(depth);
  const b = config.brand;
  const title = page.title ? `${page.title} | ${b.name}` : `${b.name} | ${b.tagline}`;
  const url = `${config.site.baseUrl}/${page.path === 'index.html' ? '' : page.path}`;
  const desc = page.description || b.shortDescription;
  const nav = pages.nav.map((n) => `<li><a href="${R}${n.href}"${n.key === page.nav ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('');
  const ld = [localBusiness()].concat(page.jsonld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  const scripts = ['data.js', 'jewelry.js', 'site.js'].concat(page.scripts || []).map((s) => `<script src="${R}assets/js/${s}" defer></script>`).join('\n');
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${page.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(url)}">`}
<meta name="theme-color" content="${config.site.themeColor}">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="${esc(b.name)}">
<meta property="og:title" content="${esc(page.title || b.name)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${config.site.baseUrl}/assets/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${config.site.locale}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${R}assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${R}assets/img/apple-touch-icon.png">
<link rel="manifest" href="${R}site.webmanifest">
<link rel="preload" href="${R}assets/fonts/newsreader.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${R}assets/fonts/geist.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${R}assets/css/tokens.css">
<link rel="stylesheet" href="${R}assets/css/site.css">
<script>document.documentElement.className='js';</script>
${ld}
${scripts}
</head>
<body data-page="${page.key}" data-root="${R}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="${R}index.html" aria-label="${esc(b.name)} home">${logo()}</a>
    <nav class="primary-nav" id="primary-nav" aria-label="Primary">
      <ul>${nav}</ul>
    </nav>
    <div class="header-actions">
      <a class="saved-link" href="${R}saved.html" aria-label="Saved pieces"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg><span class="saved-count" data-saved-count hidden>0</span></a>
      <a class="btn btn-primary btn-small header-cta" href="${R}book.html">Book a consultation</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"><span class="menu-bars" aria-hidden="true"></span><span class="visually-hidden">Menu</span></button>
    </div>
  </div>
</header>
<main id="main" tabindex="-1">
${page.body(R)}
</main>
${footer(R)}
</body>
</html>
`;
}

function logo() {
  const { esc } = helpers();
  return `<span class="logo-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="18" r="9.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M16 4.5l4 4.2-4 4-4-4z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg></span><span class="logo-word">${esc(config.brand.name)}</span>`;
}

function footer(R) {
  const { esc, time12 } = helpers();
  const c = config.contact, a = c.address, year = new Date().getFullYear();
  const hours = c.hours.map((h) => `<li><span>${esc(h.short || h.label)}</span><span>${h.closed ? 'Closed' : `${time12(h.opens)} to ${time12(h.closes)}`}</span></li>`).join('');
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <a class="logo" href="${R}index.html">${logo()}</a>
      <p>${esc(config.brand.tagline)}</p>
      <p class="footer-cta"><a class="btn btn-ghost-light" href="${R}book.html">Book a consultation</a></p>
    </div>
    <div>
      <h2 class="footer-h">Visit</h2>
      <address>${esc(a.street)}<br>${esc(a.locality)}, ${esc(a.region)} ${esc(a.postalCode)}</address>
      <p><a href="tel:${c.phoneHref}">${esc(c.phone)}</a><br><a href="mailto:${c.email}">${esc(c.email)}</a><br><a href="https://wa.me/${c.whatsapp}" rel="noopener">WhatsApp</a></p>
    </div>
    <div>
      <h2 class="footer-h">Hours</h2>
      <ul class="hours">${hours}</ul>
      <p class="small">By appointment preferred.</p>
    </div>
    <div>
      <h2 class="footer-h">Atelier</h2>
      <ul class="footer-links">
        ${pages.footer.map((n) => `<li><a href="${R}${n.href}">${esc(n.label)}</a></li>`).join('')}
      </ul>
    </div>
  </div>
  <div class="wrap footer-base">
    <p>&copy; ${year} ${esc(config.brand.legalName)}. <a href="${R}legal.html">Privacy, terms and accessibility</a>.</p>
    ${config.demo ? `<p class="demo-note">Demo template. The business, people, commissions, prices and reviews on this site are fictional. Jewelry images are illustrations.</p>` : ''}
  </div>
</footer>`;
}

function localBusiness() {
  const c = config.contact, a = c.address;
  const dayNames = { Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' };
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${config.site.baseUrl}/#business`,
    name: config.brand.name,
    description: config.brand.shortDescription,
    url: config.site.baseUrl + '/',
    image: `${config.site.baseUrl}/assets/img/og-image.png`,
    logo: `${config.site.baseUrl}/assets/img/favicon.svg`,
    telephone: c.phoneHref,
    email: c.email,
    priceRange: '$$$',
    foundingDate: String(config.brand.founded),
    address: { '@type': 'PostalAddress', streetAddress: a.street, addressLocality: a.locality, addressRegion: a.region, postalCode: a.postalCode, addressCountry: a.country },
    geo: { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lng },
    openingHoursSpecification: c.hours.filter((h) => !h.closed).map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days.map((d) => dayNames[d]), opens: h.opens, closes: h.closes })),
    sameAs: Object.values(c.social)
  };
}

function tokens() {
  const c = config.colors;
  const name = (k) => '--' + k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  return `:root {\n${Object.entries(c).map(([k, v]) => `  ${name(k)}: ${v};`).join('\n')}\n}\n`;
}

function dataScript() {
  const c = config;
  const pub = {
    brand: c.brand, contact: c.contact, consultation: c.consultation, endpoints: c.endpoints, pricingGuide: c.pricingGuide, demo: c.demo,
    budgets: BUDGETS
  };
  const commissions = content.commissions.map(({ id, title, category, shape, sideShape, metal, style, carat, origin, stone, budget, summary }) => ({ id, title, category, shape, sideShape, metal, style, carat, origin, stone, budget, summary }));
  return `window.A47_CONFIG = ${JSON.stringify(pub)};\nwindow.A47_COMMISSIONS = ${JSON.stringify(commissions)};\n`;
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.list.filter((p) => !p.noindex).map((p) => `  <url><loc>${config.site.baseUrl}/${p.path === 'index.html' ? '' : p.path}</loc><lastmod>${today}</lastmod></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function favicon() {
  const c = config.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${c.ink}"/><circle cx="32" cy="37" r="15" fill="none" stroke="${c.champagne}" stroke-width="2.6"/><path d="M32 12l7 7.4-7 7-7-7z" fill="none" stroke="${c.champagne}" stroke-width="2.4"/></svg>\n`;
}
