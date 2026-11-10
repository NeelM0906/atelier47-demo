"""End-to-end verification for the Atelier47 static site.

Serves the site, then with headless Chrome: screenshots every page at each width,
records console errors and failed requests, checks every local link and asset,
exercises filters, wishlist, ring builder, booking, service and contact forms,
keyboard and reduced-motion behavior, and runs axe-core when available.
Exit code is non-zero when any check fails. Results go to screenshots/report.json.
"""
import json, os, re, subprocess, sys, time, threading, functools, http.server, socketserver
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'screenshots'
CHROME = os.environ.get('CHROME_PATH', '/usr/bin/google-chrome')
AXE = Path(os.environ.get('AXE_PATH', ROOT.parent / '.a47tools/node_modules/axe-core/axe.min.js'))
PORT = int(os.environ.get('PORT', '8147'))
BASE = f'http://127.0.0.1:{PORT}/'
MAIN = ['index', 'collections', 'design', 'education', 'process', 'book', 'services', 'about', 'faq', 'contact', 'legal', 'saved', '404']
WIDTHS_MAIN = [375, 768, 1280, 1920]
WIDTHS_WORK = [375, 1280]

results = {'checks': [], 'console': {}, 'failed_requests': {}, 'links': {}, 'axe': {}, 'screenshots': []}
def check(name, ok, detail=''):
    results['checks'].append({'name': name, 'ok': bool(ok), 'detail': detail})
    print(('PASS ' if ok else 'FAIL ') + name + (f'  ({detail})' if detail else ''))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

def serve():
    handler = functools.partial(Quiet, directory=str(ROOT))
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(('127.0.0.1', PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

class Refs(HTMLParser):
    def __init__(self): super().__init__(); self.refs = []; self.ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a: self.ids.add(a['id'])
        for k in ('href', 'src'):
            if k in a and a[k]: self.refs.append((tag, a[k]))

def link_check():
    pages = sorted(p for p in ROOT.rglob('*.html') if 'screenshots' not in p.parts and 'scripts' not in p.parts)
    ids = {}
    parsed = {}
    for p in pages:
        r = Refs(); r.feed(p.read_text()); parsed[p] = r; ids[p.resolve()] = r.ids
    broken, external = [], set()
    for p, r in parsed.items():
        for tag, ref in r.refs:
            u = urlparse(ref)
            if u.scheme in ('http', 'https', 'mailto', 'tel'):
                if u.scheme in ('http', 'https') and 'atelier47.example' not in u.netloc: external.add(u.scheme + '://' + u.netloc)
                continue
            if p.name == '404.html' and ref.startswith('/'):
                target = ROOT / ref.lstrip('/').split('#')[0].split('?')[0]
            else:
                target = (p.parent / unquote(u.path)).resolve() if u.path else p.resolve()
            if not target.exists():
                broken.append(f'{p.relative_to(ROOT)} -> {ref}')
            elif u.fragment and target.suffix == '.html' and u.fragment not in ids.get(target.resolve(), set()):
                broken.append(f'{p.relative_to(ROOT)} -> {ref} (missing #{u.fragment})')
    results['links'] = {'pages': len(pages), 'broken': broken, 'external_hosts_not_fetched': sorted(external)}
    check('local links and assets resolve', not broken, f'{len(pages)} pages, {len(broken)} broken')
    return [p.relative_to(ROOT).as_posix() for p in pages]

def scroll_through(pg):
    h = pg.evaluate('document.documentElement.scrollHeight')
    for y in range(0, h + 600, 500):
        pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(25)
    pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(1300)

def attach(pg, key):
    errs, fails = results['console'].setdefault(key, []), results['failed_requests'].setdefault(key, [])
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('requestfailed', lambda r: fails.append(r.url + ' ' + (r.failure or '')))
    pg.on('response', lambda r: fails.append(f'{r.status} {r.url}') if r.status >= 400 and not r.url.endswith('/does-not-exist.html') else None)

def screenshots(b, pages):
    SHOTS.mkdir(exist_ok=True)
    for f in SHOTS.glob('*.png'): f.unlink()
    for rel in pages:
        name = rel[:-5].replace('/', '__')
        widths = WIDTHS_WORK if rel.startswith('work/') else WIDTHS_MAIN
        for w in widths:
            ctx = b.new_context(viewport={'width': w, 'height': 900 if w > 600 else 812})
            pg = ctx.new_page(); attach(pg, rel)
            pg.goto(BASE + rel, wait_until='networkidle')
            scroll_through(pg)
            out = SHOTS / f'{name}-{w}.png'
            pg.screenshot(path=str(out), full_page=True)
            results['screenshots'].append(out.relative_to(ROOT).as_posix())
            overflow = pg.evaluate('document.documentElement.scrollWidth - window.innerWidth')
            results.setdefault('overflow', {})[f'{rel}@{w}'] = overflow
            ctx.close()
    over = {k: v for k, v in results['overflow'].items() if v > 1}
    check('no horizontal overflow at any width', not over, f"{len(results['overflow'])} page widths, overflowing: {over}")
    bad = {k: v for k, v in results['console'].items() if v}
    check('no console errors on any page', not bad, json.dumps(bad)[:400])
    badr = {k: v for k, v in results['failed_requests'].items() if v}
    check('no failed or 4xx requests', not badr, json.dumps(badr)[:400])
    check('screenshots captured', len(results['screenshots']) == len(MAIN) * 4 + (len(pages) - len(MAIN)) * 2, str(len(results['screenshots'])))

def functional(b):
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    pg = ctx.new_page(); attach(pg, 'functional')
    data = json.loads((ROOT / 'content/commissions.json').read_text())

    pg.goto(BASE + 'collections.html')
    pg.select_option('#flt-shape', 'oval')
    visible = pg.locator('#piece-grid .piece:not([hidden])').count()
    check('filter by shape shows only ovals', visible == sum(1 for p in data if p['shape'] == 'oval'), f'{visible} visible')
    check('filter state is in the URL', 'shape=oval' in pg.url, pg.url)
    pg.select_option('#flt-metal', 'rose')
    check('combined filter to an empty set shows empty state', pg.locator('#empty-state').is_visible())
    pg.click('#empty-state [data-reset-filters]'); pg.wait_for_timeout(50)
    check('reset restores all commissions', pg.locator('#piece-grid .piece:not([hidden])').count() == len(data))
    pg.goto(BASE + 'collections.html?budget=under-10k')
    check('filter restores from URL', pg.locator('#piece-grid .piece:not([hidden])').count() == sum(1 for p in data if p['budget'] == 'under-10k'))

    pg.goto(BASE + 'collections.html')
    pg.locator('#piece-grid .save-btn').nth(0).click()
    pg.locator('#piece-grid .save-btn').nth(2).click()
    check('save toggles aria-pressed', pg.locator('#piece-grid .save-btn').nth(0).get_attribute('aria-pressed') == 'true')
    check('header saved count updates', pg.locator('[data-saved-count]').inner_text() == '2')
    pg.goto(BASE + 'saved.html')
    check('saved page lists saved pieces', pg.locator('#saved-grid .piece').count() == 2)
    pg.locator('#saved-grid .save-btn').first.click(); pg.wait_for_timeout(50)
    check('removing from saved page updates list', pg.locator('#saved-grid .piece').count() == 1)
    pg.click('#saved-clear')
    check('empty saved page shows empty state without actions', pg.locator('#saved-empty').is_visible() and not pg.locator('#saved-actions').is_visible())
    leaks = []
    for name in MAIN:
        pg.goto(BASE + name + '.html')
        n = pg.evaluate("[...document.querySelectorAll('[hidden]')].filter(e => getComputedStyle(e).display !== 'none').length")
        if n: leaks.append(f'{name}: {n}')
    check('hidden elements stay hidden on every page', not leaks, ', '.join(leaks))
    pg.goto(BASE + 'collections.html'); pg.locator('#piece-grid .save-btn').nth(2).click()

    pg.goto(BASE + 'design.html')
    pg.click('label.choice:has(input[name="shape"][value="emerald"])')
    check('ring preview updates on shape change', 'emerald' in (pg.locator('#ring-preview svg').get_attribute('aria-label') or ''))
    pg.fill('#carat', '2.5'); pg.dispatch_event('#carat', 'input')
    check('carat output updates', pg.locator('#carat-out').inner_text() == '2.5 ct')
    pg.click('label.choice:has(input[name="metal"][value="rose"])')
    check('ring preview updates on metal change', 'rose gold' in (pg.locator('#ring-preview svg').get_attribute('aria-label') or ''))
    pg.click('label.choice:has(input[name="style"][value="halo"])')
    check('estimate shows a range', re.match(r'^\$[\d,]+ to \$[\d,]+', pg.locator('#estimate-value').inner_text()) is not None, pg.locator('#estimate-value').inner_text())
    pg.click('#builder-form [type=submit]')
    errs = pg.locator('#builder-form .form-errors li').count()
    check('builder blocks empty submit with error summary', errs >= 4 and pg.locator('#builder-form .form-errors').is_visible(), f'{errs} errors')
    check('error summary receives focus', pg.evaluate("document.activeElement.classList.contains('form-errors')"))
    pg.click('label.choice:has(input[name="budget"][value="10-25k"])')
    pg.click('label.choice:has(input[name="timeline"][value="standard"])')
    pg.fill('#b-name', 'Jamie Demo'); pg.fill('#b-email', 'not-an-email')
    pg.click('#builder-form [type=submit]')
    check('invalid email is rejected', 'email' in pg.locator('[data-error-for="email"]').first.inner_text().lower())
    pg.fill('#b-email', 'jamie@example.com')
    pg.click('#builder-form [type=submit]')
    pg.wait_for_selector('#builder-success:not([hidden])', timeout=4000)
    check('builder success state shows a reference', pg.locator('#builder-success [data-ref]').inner_text().startswith('A47-DS-'))
    brief = pg.evaluate("JSON.parse(localStorage.getItem('a47.brief'))")
    check('design brief persisted', brief and brief['shape'] == 'emerald' and brief['metal'] == 'rose', json.dumps(brief))
    pg.goto(BASE + 'design.html?from=kyoto-sapphire')
    check('builder presets from a commission', pg.locator('input[name="shape"][value="oval"]').is_checked() and pg.locator('input[name="style"][value="halo"]').is_checked())

    pg.goto(BASE + 'book.html?brief=1')
    check('booking shows attached brief and saved piece', pg.locator('#attachment-list li').count() >= 2, str(pg.locator('#attachment-list li').count()))
    pg.click('#booking-form [type=submit]')
    check('booking blocks empty submit', pg.locator('#booking-form .form-errors li').count() >= 4)
    check('closed Saturdays are disabled', pg.evaluate("[...document.querySelectorAll('.cal-day')].filter(b=>/^Saturday/.test(b.getAttribute('aria-label'))).every(b=>b.disabled)"))
    day = pg.locator('.cal-day:not([disabled])').first
    chosen = day.get_attribute('data-date'); day.click()
    check('picking a day reveals time slots', pg.locator('#slots input[name="time"]:not([disabled])').count() > 0)
    fri = pg.locator('.cal-day:not([disabled])[aria-label^="Friday"]').first
    if fri.count():
        fri.click()
        times = pg.eval_on_selector_all('#slots input[name="time"]', 'els => els.map(e => e.value)')
        check('Friday slots end by the 2 pm close', times and all(t <= '13:00' for t in times), ', '.join(times))
        pg.locator('.cal-day[data-date="' + chosen + '"]').click()
    pg.locator('#slots label.choice').first.click()
    pg.fill('#k-name', 'Jamie Demo'); pg.fill('#k-email', 'jamie@example.com'); pg.fill('#k-phone', '212 555 0199')
    pg.check('input[name="retainerAck"]')
    pg.click('#booking-form [type=submit]')
    pg.wait_for_selector('#booking-success:not([hidden])', timeout=4000)
    check('booking success with reference and summary', pg.locator('#booking-success [data-ref]').inner_text().startswith('A47-BK-') and pg.locator('#booking-summary div').count() == 5)
    with pg.expect_download() as dl:
        pg.click('#ics-download')
    ics = Path(dl.value.path()).read_text()
    check('calendar file is valid ICS in New York time', 'BEGIN:VEVENT' in ics and 'TZID=America/New_York:' + chosen.replace('-', '') in ics)
    pg.goto(BASE + 'book.html')
    pg.click(f'.cal-day[data-date="{chosen}"]')
    first_slot = pg.locator('#slots input[name="time"]').first
    check('booked slot is no longer available', first_slot.is_disabled())

    pg.goto(BASE + 'services.html')
    pg.select_option('#s-service', 'resizing'); pg.select_option('#s-item', 'engagement')
    pg.fill('#s-description', 'Size 6 to 6.5, platinum solitaire.')
    tiny = ROOT / 'scripts' / '.photo.png'; tiny.write_bytes(bytes.fromhex('89504e470d0a1a0a0000000d4948445200000001000000010806000000'))
    pg.set_input_files('#s-photos', str(tiny)); tiny.unlink()
    check('photo upload lists file', pg.locator('#file-list li').count() == 1)
    pg.fill('#s-name', 'Jamie Demo'); pg.fill('#s-email', 'jamie@example.com')
    pg.click('#service-form [type=submit]')
    pg.wait_for_selector('#service-success:not([hidden])', timeout=4000)
    check('service inquiry succeeds', pg.locator('#service-success [data-ref]').inner_text().startswith('A47-SV-'))

    pg.goto(BASE + 'contact.html')
    pg.click('#contact-form [type=submit]')
    check('contact form validates', pg.locator('#contact-form .form-errors').is_visible())
    pg.fill('#m-name', 'Jamie'); pg.fill('#m-email', 'jamie@example.com'); pg.fill('#m-message', 'Hello')
    pg.click('#contact-form [type=submit]')
    pg.wait_for_selector('#contact-success:not([hidden])', timeout=4000)
    check('contact form succeeds', True)
    subs = pg.evaluate("JSON.parse(localStorage.getItem('a47.submissions')).map(s=>s.kind)")
    check('all submissions stored locally with kinds', sorted(set(subs)) == ['booking', 'contact', 'inquiry', 'service'], str(subs))

    pg.goto(BASE + 'education.html')
    before = pg.locator('#explorer-sum').inner_text()
    pg.fill('#x-clarity', '9'); pg.dispatch_event('#x-clarity', 'input')
    check('4Cs explorer updates', pg.locator('#explorer-sum').inner_text() != before and 'I2' in pg.locator('#explorer-sum').inner_text())
    check('4Cs explorer renders inclusions', pg.evaluate("document.querySelector('#explorer-svg svg').innerHTML.split('#2f2a24').length - 1") >= 15)

    pg.goto(BASE + 'index.html'); pg.keyboard.press('Tab')
    check('first Tab focuses skip link', pg.evaluate("document.activeElement.classList.contains('skip')"))
    pg.keyboard.press('Enter')
    check('skip link moves focus to main', pg.evaluate("document.activeElement.id === 'main'"))
    ctx.close()

    m = b.new_context(viewport={'width': 375, 'height': 812}); mp = m.new_page(); attach(mp, 'mobile-nav')
    mp.goto(BASE + 'index.html')
    check('mobile nav hidden by default', not mp.locator('#primary-nav').is_visible())
    mp.click('.menu-toggle')
    check('mobile nav opens', mp.locator('#primary-nav').is_visible() and mp.locator('.menu-toggle').get_attribute('aria-expanded') == 'true')
    mp.keyboard.press('Escape')
    check('Escape closes mobile nav', not mp.locator('#primary-nav').is_visible())
    m.close()

    r = b.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); rp = r.new_page()
    rp.goto(BASE + 'index.html'); rp.wait_for_timeout(200)
    check('reduced motion shows content without animation', rp.evaluate("[...document.querySelectorAll('.reveal')].every(e=>getComputedStyle(e).opacity==='1')"))
    r.close()

    n = b.new_context(viewport={'width': 1280, 'height': 900}, java_script_enabled=False); np_ = n.new_page()
    np_.goto(BASE + 'collections.html')
    check('content readable without JavaScript', np_.locator('#piece-grid .piece').count() == len(data) and np_.locator('.piece').first.is_visible())
    n.close()

def antipatterns():
    html = ' '.join(p.read_text() for p in ROOT.rglob('*.html') if 'screenshots' not in p.parts).lower()
    code = ' '.join(p.read_text() for p in list((ROOT / 'assets/js').glob('*.js')) + [ROOT / 'assets/css/site.css']).lower()
    found = [w for w in ['<marquee', '<dialog', 'class="modal', 'src="http', "href=\"http://", 'googleapis', 'gtag(', 'fbq('] if w in html]
    found += [w for w in ['countdown', 'setinterval', 'window.open', 'alert(', 'modal', 'popup', 'marquee', 'showmodal'] if w in code]
    check('no marquees, countdowns, popups, CDNs or trackers in source', not found, ', '.join(found))
    dashes = [str(p.relative_to(ROOT)) for p in ROOT.rglob('*.html') if '\u2014' in p.read_text()]
    check('no long dashes in page copy', not dashes, ', '.join(dashes))

def seo(pages):
    problems, types = [], set()
    sitemap = (ROOT / 'sitemap.xml').read_text()
    for rel in pages:
        html = (ROOT / rel).read_text()
        need = ['<title>', 'name="description"', 'property="og:title"', 'property="og:description"', 'property="og:image"', 'name="twitter:card"', 'rel="icon"', 'lang="en"', 'name="viewport"']
        if 'noindex' not in html: need.append('rel="canonical"')
        problems += [f'{rel} missing {n}' for n in need if n not in html]
        blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
        if not blocks: problems.append(f'{rel} has no JSON-LD')
        for raw in blocks:
            try: data = json.loads(raw)
            except ValueError as e: problems.append(f'{rel} JSON-LD invalid: {e}'); continue
            for node in data.get('@graph', [data]) if isinstance(data, dict) else data:
                t = node.get('@type'); types.update(t if isinstance(t, list) else [t])
        if rel not in ('404.html', 'saved.html') and not re.search(r'example/' + re.escape('' if rel == 'index.html' else rel) + '<', sitemap):
            problems.append(f'{rel} not in sitemap')
    if 'JewelryStore' not in types: problems.append('no JewelryStore (schema.org LocalBusiness) node')
    check('SEO meta, OG, canonical, favicon on every page', not [x for x in problems if 'JSON-LD' not in x and 'JewelryStore' not in x], '; '.join(problems)[:400])
    check('JSON-LD parses on every page and declares JewelryStore', not [x for x in problems if 'JSON-LD' in x or 'JewelryStore' in x], ', '.join(sorted(t for t in types if t)))
    check('robots.txt points to sitemap', 'Sitemap:' in (ROOT / 'robots.txt').read_text())

def axe(b, pages):
    if not AXE.exists():
        check('axe-core accessibility scan', True, 'skipped: axe-core not installed'); return
    script = AXE.read_text()
    total = 0
    for rel in pages:
        if rel.startswith('work/') and rel != 'work/the-montauk-oval.html': continue
        for w in (375, 1280):
            ctx = b.new_context(viewport={'width': w, 'height': 900}, reduced_motion='reduce'); pg = ctx.new_page()
            pg.goto(BASE + rel, wait_until='networkidle'); pg.add_script_tag(content=script)
            res = pg.evaluate("axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}).then(r => r.violations.map(v => ({id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(' ')})))")
            if res: results['axe'][f'{rel}@{w}'] = res; total += len(res)
            ctx.close()
    check('axe-core WCAG 2.2 AA scan has no violations', total == 0, json.dumps(results['axe'])[:600])

if __name__ == '__main__':
    httpd = serve()
    pages = link_check()
    antipatterns()
    seo(pages)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        functional(b)
        axe(b, pages)
        if '--no-shots' not in sys.argv: screenshots(b, pages)
        b.close()
    httpd.shutdown()
    fails = [c for c in results['checks'] if not c['ok']]
    SHOTS.mkdir(exist_ok=True)
    (SHOTS / 'report.json').write_text(json.dumps(results, indent=2))
    print(f"\n{len(results['checks']) - len(fails)} passed, {len(fails)} failed")
    sys.exit(1 if fails else 0)
