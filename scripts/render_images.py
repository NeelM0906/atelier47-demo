"""Render og-image.png (1200x630) and apple-touch-icon.png (180x180) from the brand config with headless Chrome."""
import json, os, subprocess, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
CHROME = os.environ.get('CHROME_PATH', '/usr/bin/google-chrome')
cfg = json.loads((ROOT / 'site.config.json').read_text())
hero = subprocess.check_output(['node', '-e', """
const J=require('./assets/js/jewelry.js');const c=require('./content/commissions.json');
const p=c.find(x=>x.featured)||c[0];process.stdout.write(J.render(p,'og'));"""], cwd=ROOT, text=True)
col, brand = cfg['colors'], cfg['brand']
fonts = f"""
@font-face{{font-family:N;src:url('{(ROOT/'assets/fonts/newsreader.woff2').as_uri()}')}}
@font-face{{font-family:NI;src:url('{(ROOT/'assets/fonts/newsreader-italic.woff2').as_uri()}')}}
@font-face{{font-family:G;src:url('{(ROOT/'assets/fonts/geist.woff2').as_uri()}')}}"""
og = f"""<html><head><style>{fonts}
body{{margin:0;width:1200px;height:630px;background:{col['ivory']};display:grid;grid-template-columns:1fr 520px;font-family:G}}
.l{{padding:80px 0 80px 84px;display:flex;flex-direction:column;justify-content:space-between}}
.e{{font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:{col['champagneDeep']}}}
h1{{font:300 82px/1.02 N;color:{col['ink']};margin:0}} h1 em{{font-family:NI;font-weight:300}}
.n{{font:400 30px N;color:{col['ink']}}} .r{{background:radial-gradient(110% 90% at 50% 40%,{col['paper']},{col['linen']});display:grid;place-items:center}}
.r svg{{width:440px}}</style></head><body><div class="l"><div class="e">Private atelier · West 47th Street</div>
<h1>Made with you,<br><em>on 47th Street.</em></h1><div class="n">{brand['name']}</div></div><div class="r">{hero}</div></body></html>"""
icon = f"""<html><body style="margin:0">{(ROOT/'assets/img/favicon.svg').read_text().replace('<svg ', '<svg width="180" height="180" ')}</body></html>"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME)
    for html, size, out in [(og, (1200, 630), 'og-image.png'), (icon, (180, 180), 'apple-touch-icon.png')]:
        tmp = ROOT / 'scripts' / '.render.html'
        tmp.write_text(html)
        pg = b.new_page(viewport={'width': size[0], 'height': size[1]})
        pg.goto(tmp.as_uri()); pg.wait_for_timeout(400)
        pg.screenshot(path=str(ROOT / 'assets/img' / out))
        pg.close(); tmp.unlink()
        print('wrote assets/img/' + out)
    b.close()
