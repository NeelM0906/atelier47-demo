#!/usr/bin/env bash
# Usage: LIGHTHOUSE=path/to/lighthouse scripts/lighthouse.sh [page.html ...]
set -euo pipefail
cd "$(dirname "$0")/.."
LH="${LIGHTHOUSE:-../.a47tools/node_modules/.bin/lighthouse}"
PORT="${PORT:-8149}"
if [ $# -gt 0 ]; then PAGES=("$@"); else PAGES=(index.html collections.html design.html education.html book.html work/the-montauk-oval.html); fi
OUT=verification/lighthouse
mkdir -p "$OUT" && rm -f "$OUT"/*.json
python3 scripts/serve.py "$PORT" & SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
sleep 1
for preset in mobile desktop; do
  for page in "${PAGES[@]}"; do
    name="$(basename "${page%.html}")-$preset"
    extra=(); [ "$preset" = desktop ] && extra=(--preset=desktop)
    timeout 180 "$LH" "http://127.0.0.1:$PORT/$page" --quiet --output=json --output-path="$OUT/$name.json" \
      --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new --no-sandbox" "${extra[@]}"
    echo "done $name"
  done
done
python3 - "$OUT" <<'PY'
import json, sys, glob, os
rows = []
for f in sorted(glob.glob(sys.argv[1] + '/*-*.json')):
    r = json.load(open(f))
    rows.append({'run': os.path.basename(f)[:-5], **{k: round(v['score'] * 100) for k, v in r['categories'].items()}})
for r in rows: print(f"{r['run']:<28} perf {r['performance']:>3}  a11y {r['accessibility']:>3}  bp {r['best-practices']:>3}  seo {r['seo']:>3}")
json.dump(rows, open(sys.argv[1] + '/summary.json', 'w'), indent=2)
md = ['# Lighthouse', '', 'Local static server with gzip (`scripts/serve.py`), default mobile throttling and the desktop preset.', '', '| Run | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |', '| --- | --- | --- | --- | --- | --- | --- | --- |']
for f in sorted(glob.glob(sys.argv[1] + '/*-*.json')):
    r = json.load(open(f)); c = r['categories']; a = r['audits']
    md.append(f"| {os.path.basename(f)[:-5]} | {round(c['performance']['score']*100)} | {round(c['accessibility']['score']*100)} | {round(c['best-practices']['score']*100)} | {round(c['seo']['score']*100)} | {a['largest-contentful-paint']['displayValue']} | {a['cumulative-layout-shift']['displayValue']} | {a['total-blocking-time']['displayValue']} |")
open(sys.argv[1] + '/summary.md', 'w').write('\n'.join(md) + '\n')
PY
