(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.A47Jewelry = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SHAPES = {
    round:    { label: 'Round',    ratio: 1,    cut: 'brilliant' },
    oval:     { label: 'Oval',     ratio: 1.38, cut: 'brilliant' },
    cushion:  { label: 'Cushion',  ratio: 1.06, cut: 'brilliant' },
    emerald:  { label: 'Emerald',  ratio: 1.42, cut: 'step', corner: 0.2 },
    asscher:  { label: 'Asscher',  ratio: 1,    cut: 'step', corner: 0.27 },
    princess: { label: 'Princess', ratio: 1,    cut: 'brilliant', corner: 0.015 },
    radiant:  { label: 'Radiant',  ratio: 1.28, cut: 'brilliant', corner: 0.16 },
    pear:     { label: 'Pear',     ratio: 1.55, cut: 'brilliant' },
    marquise: { label: 'Marquise', ratio: 2,    cut: 'brilliant' }
  };

  var METALS = {
    platinum: { label: 'Platinum',       stops: ['#fbfbfa', '#d5d7d8', '#8f9496', '#c3c6c7', '#eef0f0'] },
    white:    { label: '18k white gold', stops: ['#fbfaf6', '#d9d6cf', '#97938a', '#c6c2b9', '#efece6'] },
    yellow:   { label: '18k yellow gold', stops: ['#fff0c4', '#e9c477', '#a5792b', '#d3a650', '#f8dc98'] },
    rose:     { label: '18k rose gold',  stops: ['#fde4d9', '#e8ad97', '#a5624e', '#d18d76', '#f6cdbd'] }
  };

  var STYLES = {
    solitaire:    { label: 'Solitaire' },
    halo:         { label: 'Halo' },
    'three-stone': { label: 'Three stone' },
    pave:         { label: 'Pavé band' },
    bezel:        { label: 'Bezel' },
    vintage:      { label: 'Vintage milgrain' },
    'east-west':  { label: 'East-west' },
    'toi-et-moi': { label: 'Toi et moi' }
  };

  var STONES = {
    diamond:   { label: 'Diamond',   core: '#ffffff', mid: '#e4e9ee', edge: '#aab4bd', dark: '#5c6873', line: '#7f8a94' },
    sapphire:  { label: 'Sapphire',  core: '#a9c3f0', mid: '#3d63b8', edge: '#1b2e6e', dark: '#0e1a45', line: '#1b2e6e' },
    emerald:   { label: 'Emerald',   core: '#9fe0b8', mid: '#2a8a57', edge: '#0f4d30', dark: '#06301d', line: '#0f4d30' },
    morganite: { label: 'Morganite', core: '#fff1ee', mid: '#f1c4bc', edge: '#c98f86', dark: '#8a5a53', line: '#b07a72' }
  };

  var CATEGORIES = { ring: 'Ring', band: 'Wedding band', pendant: 'Pendant', earrings: 'Earrings' };

  function r(n) { return Math.round(n * 100) / 100; }
  function pts(list) { return list.map(function (p) { return r(p[0]) + ',' + r(p[1]); }).join(' '); }

  function octagon(w, h, c) {
    var cx = w * c, cy = Math.min(w * c, h / 2 - 0.001);
    var x = w / 2, y = h / 2;
    return [[-x + cx, -y], [x - cx, -y], [x, -y + cy], [x, y - cy], [x - cx, y], [-x + cx, y], [-x, y - cy], [-x, -y + cy]];
  }

  function resample(poly, n) {
    var segs = [], total = 0;
    for (var i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length];
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push([a, b, len]); total += len;
    }
    var out = [], step = total / n, d = step / 2, si = 0, acc = 0;
    for (var k = 0; k < n; k++) {
      var target = d + k * step;
      while (acc + segs[si][2] < target) { acc += segs[si][2]; si++; }
      var s = segs[si], t = (target - acc) / s[2];
      out.push([s[0][0] + (s[1][0] - s[0][0]) * t, s[0][1] + (s[1][1] - s[0][1]) * t]);
    }
    return out;
  }

  function outline(shape, w, n) {
    var spec = SHAPES[shape], h = w * spec.ratio, out = [], i, t;
    n = n || 32;
    if (spec.corner !== undefined) return resample(octagon(w, h, spec.corner), n);
    for (i = 0; i < n; i++) {
      t = (i / n) * Math.PI * 2;
      var s = Math.sin(t), c = Math.cos(t), x, y;
      if (shape === 'cushion') {
        x = Math.sign(s) * Math.pow(Math.abs(s), 0.62) * w / 2;
        y = -Math.sign(c) * Math.pow(Math.abs(c), 0.62) * h / 2;
      } else if (shape === 'marquise') {
        x = Math.sign(s) * Math.pow(Math.abs(s), 1.35) * w / 2;
        y = -c * h / 2;
      } else if (shape === 'pear') {
        var k = t <= Math.PI / 2 || t >= Math.PI * 1.5 ? Math.pow(Math.abs(s), 0.55) : 1;
        x = s * k * w / 2;
        y = -c * h / 2;
        if (c < 0) y = -c * h / 2 * 0.92;
      } else {
        x = s * w / 2; y = -c * h / 2;
      }
      out.push([x, y]);
    }
    return out;
  }

  function place(poly, cx, cy, rot, scale) {
    var a = (rot || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), k = scale || 1;
    return poly.map(function (p) { var x = p[0] * k, y = p[1] * k; return [cx + x * ca - y * sa, cy + x * sa + y * ca]; });
  }

  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

  function shade(angle, alt) {
    var light = Math.cos(angle - (-Math.PI * 0.75));
    return 0.5 + 0.38 * light + (alt ? 0.16 : -0.16);
  }

  function facetFill(v, st, gain) {
    gain = gain === undefined ? 1 : gain;
    if (v > 0.55) return '<polygon points="%P" fill="#fff" fill-opacity="' + r(Math.min(0.92, (v - 0.4) * 1.25 * gain)) + '"/>';
    return '<polygon points="%P" fill="' + st.dark + '" fill-opacity="' + r(Math.min(0.62, (0.62 - v) * 1.05 * gain)) + '"/>';
  }

  function stoneDefs(id, stoneKey, tint) {
    var st = STONES[stoneKey] || STONES.diamond;
    var core = st.core, mid = st.mid, edge = st.edge;
    if (tint) { core = mix(core, '#f7e7b4', tint * 0.7); mid = mix(mid, '#eed79a', tint); edge = mix(edge, '#b99a52', tint * 0.8); }
    return '<radialGradient id="' + id + '" cx="42%" cy="38%" r="70%">' +
      '<stop offset="0" stop-color="' + core + '"/><stop offset="0.55" stop-color="' + mid + '"/><stop offset="1" stop-color="' + edge + '"/></radialGradient>';
  }

  function hex(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    return '#' + A.map(function (v, i) { return ('0' + Math.round(v + (B[i] - v) * t).toString(16)).slice(-2); }).join('');
  }

  function metalDefs(id, metalKey) {
    var m = METALS[metalKey] || METALS.platinum, s = m.stops;
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0.35" y2="1">' +
      '<stop offset="0" stop-color="' + s[0] + '"/><stop offset="0.28" stop-color="' + s[1] + '"/><stop offset="0.55" stop-color="' + s[2] + '"/>' +
      '<stop offset="0.78" stop-color="' + s[3] + '"/><stop offset="1" stop-color="' + s[4] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'b" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + s[0] + '"/><stop offset="0.6" stop-color="' + s[1] + '"/><stop offset="1" stop-color="' + s[2] + '"/></radialGradient>';
  }

  function stone(o) {
    var spec = SHAPES[o.shape] || SHAPES.round, st = STONES[o.stone] || STONES.diamond;
    var gain = o.contrast === undefined ? 1 : o.contrast;
    var svg = '', i, n;
    if (spec.cut === 'step') {
      var base = octagon(o.w, o.w * spec.ratio, spec.corner);
      var rings = [1, 0.84, 0.69, 0.5].map(function (k) { return place(base, o.cx, o.cy, o.rot, k); });
      svg += '<polygon points="' + pts(rings[0]) + '" fill="url(#' + o.grad + ')"/>';
      for (var ri = 0; ri < 3; ri++) {
        for (i = 0; i < 8; i++) {
          var a = rings[ri][i], b = rings[ri][(i + 1) % 8], c = rings[ri + 1][(i + 1) % 8], d = rings[ri + 1][i];
          var mx = (a[0] + b[0]) / 2 - o.cx, my = (a[1] + b[1]) / 2 - o.cy;
          var v = shade(Math.atan2(my, mx), (i + ri) % 2 === 0);
          svg += facetFill(v, st, gain).replace('%P', pts([a, b, c, d]));
        }
      }
      svg += '<polygon points="' + pts(rings[3]) + '" fill="#fff" fill-opacity="' + r(0.32 * gain) + '"/>';
      for (i = 0; i < 8; i++) svg += '<line x1="' + r(rings[0][i][0]) + '" y1="' + r(rings[0][i][1]) + '" x2="' + r(rings[3][i][0]) + '" y2="' + r(rings[3][i][1]) + '" stroke="' + st.line + '" stroke-opacity="0.45" stroke-width="0.4"/>';
      rings.forEach(function (ring) { svg += '<polygon points="' + pts(ring) + '" fill="none" stroke="' + st.line + '" stroke-opacity="0.5" stroke-width="0.45"/>'; });
    } else {
      n = o.shape === 'princess' || o.shape === 'radiant' ? 24 : 32;
      var outer = place(outline(o.shape, o.w, n), o.cx, o.cy, o.rot);
      var table = place(outline(o.shape, o.w, n), o.cx, o.cy, o.rot, 0.5);
      var girdle = place(outline(o.shape, o.w, n), o.cx, o.cy, o.rot, 0.8);
      svg += '<polygon points="' + pts(outer) + '" fill="url(#' + o.grad + ')"/>';
      for (i = 0; i < n; i++) {
        var j = (i + 1) % n;
        var mid = lerp(outer[i], outer[j], 0.5);
        var ang = Math.atan2(mid[1] - o.cy, mid[0] - o.cx);
        svg += facetFill(shade(ang, i % 2 === 0), st, gain).replace('%P', pts([outer[i], outer[j], girdle[j]]));
        svg += facetFill(shade(ang + 0.6, i % 2 === 1), st, gain).replace('%P', pts([outer[i], girdle[j], girdle[i]]));
        if (i % 2 === 0) {
          var k2 = (i + 2) % n;
          svg += facetFill(shade(ang + 2.2, i % 4 === 0), st, gain * 0.9).replace('%P', pts([girdle[i], girdle[k2], table[(i + 1) % n]]));
        }
      }
      svg += '<polygon points="' + pts(table) + '" fill="#fff" fill-opacity="' + r(0.28 * gain) + '" stroke="' + st.line + '" stroke-opacity="0.5" stroke-width="0.4"/>';
      for (i = 0; i < n; i += 2) svg += '<line x1="' + r(table[i][0]) + '" y1="' + r(table[i][1]) + '" x2="' + r(girdle[i][0]) + '" y2="' + r(girdle[i][1]) + '" stroke="' + st.line + '" stroke-opacity="0.3" stroke-width="0.35"/>';
    }
    var edge = spec.cut === 'step' ? place(octagon(o.w, o.w * spec.ratio, spec.corner), o.cx, o.cy, o.rot) : place(outline(o.shape, o.w, 48), o.cx, o.cy, o.rot);
    svg += '<polygon points="' + pts(edge) + '" fill="none" stroke="' + st.line + '" stroke-opacity="0.85" stroke-width="0.7"/>';
    if (gain > 0.6) svg += sparkle(o.cx - o.w * 0.18, o.cy - o.w * spec.ratio * 0.2, o.w * 0.09);
    return svg;
  }

  function sparkle(x, y, s) {
    return '<path d="M' + r(x) + ' ' + r(y - s) + 'L' + r(x + s * 0.16) + ' ' + r(y - s * 0.16) + 'L' + r(x + s) + ' ' + r(y) + 'L' + r(x + s * 0.16) + ' ' + r(y + s * 0.16) +
      'L' + r(x) + ' ' + r(y + s) + 'L' + r(x - s * 0.16) + ' ' + r(y + s * 0.16) + 'L' + r(x - s) + ' ' + r(y) + 'L' + r(x - s * 0.16) + ' ' + r(y - s * 0.16) + 'Z" fill="#fff" fill-opacity="0.9"/>';
  }

  function melee(x, y, rad, ids) {
    return '<circle cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(rad) + '" fill="url(#' + ids.melee + ')" stroke="' + ids.meleeLine + '" stroke-width="0.35"/>' +
      '<circle cx="' + r(x - rad * 0.3) + '" cy="' + r(y - rad * 0.3) + '" r="' + r(rad * 0.28) + '" fill="#fff" fill-opacity="0.85"/>';
  }

  function prong(x, y, rad, ids) {
    return '<circle cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(rad) + '" fill="url(#' + ids.metalB + ')" stroke="' + ids.metalLine + '" stroke-width="0.4"/>' +
      '<circle cx="' + r(x - rad * 0.3) + '" cy="' + r(y - rad * 0.35) + '" r="' + r(rad * 0.35) + '" fill="#fff" fill-opacity="0.7"/>';
  }

  function prongPoints(shape, w, cx, cy, rot) {
    var spec = SHAPES[shape], h = w * spec.ratio, list;
    if (spec.corner !== undefined) {
      var oc = octagon(w, h, spec.corner);
      list = [lerp(oc[7], oc[0], 0.5), lerp(oc[1], oc[2], 0.5), lerp(oc[3], oc[4], 0.5), lerp(oc[5], oc[6], 0.5)];
    } else if (shape === 'pear') {
      list = [[0, -h / 2], [-w * 0.42, h * 0.3], [w * 0.42, h * 0.3]];
    } else if (shape === 'marquise') {
      list = [[0, -h / 2], [0, h / 2], [-w / 2, 0], [w / 2, 0]];
    } else {
      var poly = outline(shape, w, 8);
      list = [poly[1], poly[3], poly[5], poly[7]];
    }
    return place(list, cx, cy, rot);
  }

  function setting(o, ids) {
    var spec = SHAPES[o.shape], svg = '', i, n, ring;
    var h = o.w * spec.ratio;
    var prongR = Math.max(1.6, o.w * 0.06);
    if (o.style === 'halo') {
      ring = place(outline(o.shape, o.w, 64), o.cx, o.cy, o.rot, 1.34);
      svg += '<polygon points="' + pts(ring) + '" fill="url(#' + ids.metal + ')" stroke="' + ids.metalLine + '" stroke-width="0.5"/>';
      var per = 0; for (i = 0; i < ring.length; i++) per += Math.hypot(ring[(i + 1) % ring.length][0] - ring[i][0], ring[(i + 1) % ring.length][1] - ring[i][1]);
      var mr = Math.max(1.5, o.w * 0.055);
      n = Math.max(14, Math.round(per * 0.86 / (mr * 2.25)));
      var mid = resampleClosed(place(outline(o.shape, o.w, 64), o.cx, o.cy, o.rot, 1.17), n);
      mid.forEach(function (p) { svg += melee(p[0], p[1], mr, ids); });
    }
    if (o.style === 'bezel' || o.style === 'vintage') {
      ring = spec.cut === 'step' ? place(octagon(o.w, h, spec.corner), o.cx, o.cy, o.rot, 1.16) : place(outline(o.shape, o.w, 64), o.cx, o.cy, o.rot, 1.16);
      svg += '<polygon points="' + pts(ring) + '" fill="url(#' + ids.metal + ')" stroke="' + ids.metalLine + '" stroke-width="0.6"/>';
      if (o.style === 'vintage') {
        var dots = resampleClosed(ring, Math.round(o.w * 1.1));
        dots.forEach(function (p) { svg += '<circle cx="' + r(p[0]) + '" cy="' + r(p[1]) + '" r="' + r(Math.max(0.7, o.w * 0.018)) + '" fill="' + ids.metalLine + '" fill-opacity="0.55"/>'; });
      }
    }
    return { under: svg, prongs: o.style === 'bezel' ? '' : prongPoints(o.shape, o.w * 1.02, o.cx, o.cy, o.rot).map(function (p) { return prong(p[0], p[1], prongR, ids); }).join('') };
  }

  function resampleClosed(poly, n) { return resample(poly, n); }

  function stoneWidth(shape, carat, base) {
    var spec = SHAPES[shape] || SHAPES.round;
    return base * Math.cbrt(Math.max(0.2, carat)) / Math.sqrt(spec.ratio);
  }

  function makeIds(uid, metal, stoneKey) {
    return {
      metal: uid + 'm', metalB: uid + 'mb', stone: uid + 's', melee: uid + 'd', shadow: uid + 'sh',
      metalLine: { platinum: '#7c8184', white: '#858177', yellow: '#8f6524', rose: '#8f5242' }[metal] || '#7c8184',
      meleeLine: '#8a949d'
    };
  }

  function defs(ids, metal, stoneKey, tint) {
    return '<defs>' + metalDefs(ids.metal, metal) + stoneDefs(ids.stone, stoneKey, tint) +
      '<radialGradient id="' + ids.melee + '" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="0.6" stop-color="#e2e8ed"/><stop offset="1" stop-color="#a3adb6"/></radialGradient>' +
      '<radialGradient id="' + ids.shadow + '"><stop offset="0" stop-color="#3b3328" stop-opacity="0.22"/><stop offset="1" stop-color="#3b3328" stop-opacity="0"/></radialGradient></defs>';
  }

  function centerStones(o, ids, cx, cy, w) {
    var out = [], side;
    if (o.style === 'east-west') out.push({ shape: o.shape, cx: cx, cy: cy, w: w, rot: 90, style: 'solitaire' });
    else if (o.style === 'toi-et-moi') {
      out.push({ shape: o.shape, cx: cx - w * 0.44, cy: cy + w * 0.12, w: w * 0.78, rot: -32, style: 'solitaire' });
      out.push({ shape: o.sideShape || 'oval', cx: cx + w * 0.44, cy: cy - w * 0.08, w: w * 0.8, rot: 14, style: 'solitaire' });
    } else if (o.style === 'three-stone') {
      side = o.sideShape || 'round';
      var sw = w * 0.58, sh = SHAPES[side].ratio, off = w * 0.5 + sw * (side === 'pear' ? sh : 1) * 0.5 + w * 0.06;
      var rotL = side === 'pear' ? 90 : 0, rotR = side === 'pear' ? -90 : 0;
      out.push({ shape: side, cx: cx - off, cy: cy + w * 0.1, w: sw, rot: rotL, style: 'solitaire' });
      out.push({ shape: side, cx: cx + off, cy: cy + w * 0.1, w: sw, rot: rotR, style: 'solitaire' });
      out.push({ shape: o.shape, cx: cx, cy: cy, w: w, rot: 0, style: 'solitaire' });
    } else out.push({ shape: o.shape, cx: cx, cy: cy, w: w, rot: 0, style: o.style });
    return out.map(function (s) {
      var set = setting(s, ids);
      return set.under + stone({ shape: s.shape, cx: s.cx, cy: s.cy, w: s.w, rot: s.rot, grad: ids.stone, stone: o.stone }) + set.prongs;
    }).join('');
  }

  function band(ids, opts) {
    var cx = 120, cy = opts.cy || 150, rx = opts.rx || 70, ry = opts.ry || 63, t = opts.t || 9;
    var outer = 'M' + (cx - rx) + ' ' + cy + 'a' + rx + ' ' + ry + ' 0 1 0 ' + rx * 2 + ' 0a' + rx + ' ' + ry + ' 0 1 0 ' + (-rx * 2) + ' 0Z';
    var irx = rx - t, iry = ry - t * 0.95, icy = cy - t * 0.55;
    var inner = 'M' + (cx - irx) + ' ' + icy + 'a' + irx + ' ' + iry + ' 0 1 0 ' + irx * 2 + ' 0a' + irx + ' ' + iry + ' 0 1 0 ' + (-irx * 2) + ' 0Z';
    var svg = '<ellipse cx="120" cy="' + (cy + ry + 10) + '" rx="' + (rx * 0.95) + '" ry="9" fill="url(#' + ids.shadow + ')"/>';
    svg += '<path d="' + outer + inner + '" fill="url(#' + ids.metal + ')" fill-rule="evenodd" stroke="' + ids.metalLine + '" stroke-width="0.6"/>';
    svg += '<path d="M' + (cx - irx + 3) + ' ' + (icy + 8) + 'A' + irx + ' ' + iry + ' 0 0 0 ' + (cx + irx - 3) + ' ' + (icy + 8) + '" fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.1"/>';
    svg += '<path d="M' + (cx - rx + 6) + ' ' + (cy + 22) + 'A' + rx + ' ' + ry + ' 0 0 0 ' + (cx - 10) + ' ' + (cy + ry - 0.5) + '" fill="none" stroke="#fff" stroke-opacity="0.65" stroke-width="1.4" stroke-linecap="round"/>';
    return { svg: svg, cx: cx, cy: cy, rx: rx, ry: ry, t: t, icy: icy, irx: irx, iry: iry };
  }

  function bandPoint(b, deg, inset) {
    var a = deg * Math.PI / 180, k = inset === undefined ? 0.5 : inset;
    var rx = b.rx - b.t * k, ry = b.ry - b.t * 0.95 * k, cy = b.cy - b.t * 0.55 * k;
    return [b.cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  }

  function wrap(inner, title, defsStr, cls) {
    return '<svg class="' + (cls || 'jewel') + '" viewBox="0 0 240 240" role="img" aria-label="' + esc(title) + '" xmlns="http://www.w3.org/2000/svg">' +
      '<title>' + esc(title) + '</title>' + defsStr + inner + '</svg>';
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function describe(p) {
    var sh = (SHAPES[p.shape] || {}).label || p.shape;
    var parts = [(p.carat ? p.carat + ' carat ' : '') + sh.toLowerCase() + ' ' + (STONES[p.stone] || STONES.diamond).label.toLowerCase()];
    if (p.style && STYLES[p.style]) parts.push(STYLES[p.style].label.toLowerCase() + ' setting');
    parts.push((METALS[p.metal] || METALS.platinum).label.toLowerCase());
    return 'Illustration: ' + parts.join(', ') + ' ' + (CATEGORIES[p.category] || 'ring').toLowerCase();
  }

  function render(p, uid) {
    uid = (uid || 'j') .replace(/[^a-z0-9]/gi, '');
    var metal = p.metal || 'platinum', stoneKey = p.stone || 'diamond', style = p.style || 'solitaire';
    var ids = makeIds(uid, metal, stoneKey), body = '', i, w;
    var category = p.category || 'ring';
    if (category === 'ring') {
      var b = band(ids, {});
      body += b.svg;
      w = stoneWidth(p.shape, p.carat || 1, 40);
      if (style === 'toi-et-moi') w *= 0.95;
      if (style === 'three-stone') w *= 0.9;
      var sh = w * SHAPES[p.shape].ratio * (style === 'east-west' ? 1 / SHAPES[p.shape].ratio / SHAPES[p.shape].ratio : 1);
      var scy = Math.min(78, b.cy - b.ry - 2 + (style === 'east-west' ? 2 : 6));
      scy = b.cy - b.ry + 4 - sh * 0.22;
      if (style === 'pave' || p.pave) {
        for (i = 0; i < 9; i++) {
          [200 + i * 6.2, 340 - i * 6.2].forEach(function (deg) { var q = bandPoint(b, deg, 0.48); body += melee(q[0], q[1], 2.3, ids); });
        }
      }
      if (style === 'vintage') {
        body += '<path d="M' + r(bandPoint(b, 214, 0.5)[0]) + ' ' + r(bandPoint(b, 214, 0.5)[1]) + 'q6 -8 12 -2 q-4 4 -8 0" fill="none" stroke="' + ids.metalLine + '" stroke-width="0.7" stroke-opacity="0.7"/>' +
          '<path d="M' + r(bandPoint(b, 326, 0.5)[0]) + ' ' + r(bandPoint(b, 326, 0.5)[1]) + 'q-6 -8 -12 -2 q4 4 8 0" fill="none" stroke="' + ids.metalLine + '" stroke-width="0.7" stroke-opacity="0.7"/>';
      }
      var gw = Math.min(w * 0.55, 22);
      if (style !== 'toi-et-moi') body += '<path d="M' + r(120 - gw) + ' ' + r(scy + sh * 0.25) + 'L' + r(120 - gw * 0.55) + ' ' + r(b.cy - b.ry + b.t + 2) + 'L' + r(120 + gw * 0.55) + ' ' + r(b.cy - b.ry + b.t + 2) + 'L' + r(120 + gw) + ' ' + r(scy + sh * 0.25) + 'Z" fill="url(#' + ids.metal + ')" stroke="' + ids.metalLine + '" stroke-width="0.5"/>';
      body += centerStones({ shape: p.shape, style: style, sideShape: p.sideShape, stone: stoneKey }, ids, 120, scy, w);
    } else if (category === 'band') {
      var bb = band(ids, { t: 11 });
      body += bb.svg;
      var count = 19;
      for (i = 0; i < count; i++) {
        var deg = 12 + i * (156 / (count - 1));
        var q = bandPoint(bb, deg, 0.5);
        var persp = 0.75 + 0.35 * Math.sin(deg * Math.PI / 180);
        body += prong(q[0] - 4.6 * persp, q[1], 1.2, ids) + melee(q[0], q[1], 3.6 * persp, ids);
      }
      for (i = 0; i < 13; i++) { var qq = bandPoint(bb, 200 + i * 11.7, 0.5); body += melee(qq[0], qq[1], 2.2, ids); }
    } else if (category === 'loose') {
      w = stoneWidth(p.shape, p.carat || 1, 118);
      var lh = w * SHAPES[p.shape].ratio;
      body += '<ellipse cx="120" cy="' + r(120 + lh / 2 + 14) + '" rx="' + r(w * 0.5) + '" ry="5" fill="url(#' + ids.shadow + ')"/>';
      body += stone({ shape: p.shape, cx: 120, cy: 120, w: w, rot: 0, grad: ids.stone, stone: stoneKey });
    } else if (category === 'pendant') {
      body += '<path d="M18 0C40 60 96 66 116 70" fill="none" stroke="url(#' + ids.metal + ')" stroke-width="1.6" stroke-dasharray="2.2 1.2"/>' +
        '<path d="M222 0C200 60 144 66 124 70" fill="none" stroke="url(#' + ids.metal + ')" stroke-width="1.6" stroke-dasharray="2.2 1.2"/>';
      body += '<ellipse cx="120" cy="74" rx="6" ry="8" fill="none" stroke="url(#' + ids.metal + ')" stroke-width="3"/>';
      w = stoneWidth(p.shape, p.carat || 1, 52);
      var ph = w * SHAPES[p.shape].ratio;
      var pcy = 84 + ph / 2 + w * 0.2;
      body += '<ellipse cx="120" cy="' + r(pcy + ph / 2 + 26) + '" rx="' + r(w * 0.7) + '" ry="5" fill="url(#' + ids.shadow + ')"/>';
      body += centerStones({ shape: p.shape, style: style, stone: stoneKey }, ids, 120, pcy, w);
    } else {
      var each = (p.carat || 1) / 2;
      w = stoneWidth(p.shape, each, 46);
      [74, 166].forEach(function (x) {
        var eh = w * SHAPES[p.shape].ratio;
        if (style === 'halo') {
          body += melee(x, 64, 6.5, ids) + '<line x1="' + x + '" y1="70" x2="' + x + '" y2="' + r(108 - eh / 2) + '" stroke="url(#' + ids.metal + ')" stroke-width="1.6"/>';
          body += centerStones({ shape: p.shape, style: 'halo', stone: stoneKey }, ids, x, 112 + eh * 0.2, w);
        } else {
          body += '<ellipse cx="' + x + '" cy="' + r(120 + eh / 2 + 22) + '" rx="' + r(w * 0.6) + '" ry="4" fill="url(#' + ids.shadow + ')"/>';
          body += centerStones({ shape: p.shape, style: style, stone: stoneKey }, ids, x, 120, w);
        }
      });
    }
    return wrap(body, p.title ? p.title + '. ' + describe(p) : describe(p), defs(ids, metal, stoneKey), p.className);
  }

  function shapeIcon(shape, size) {
    size = size || 48;
    var spec = SHAPES[shape], w = spec.ratio > 1.3 ? 22 / Math.min(spec.ratio, 1.7) : 28, poly, inner;
    if (spec.ratio >= 2) w = 15;
    if (spec.cut === 'step') { poly = place(octagon(w, w * spec.ratio, spec.corner), 24, 24, 0); inner = place(octagon(w, w * spec.ratio, spec.corner), 24, 24, 0, 0.55); }
    else { poly = place(outline(shape, w, 40), 24, 24, 0); inner = place(outline(shape, w, 40), 24, 24, 0, 0.5); }
    return '<svg class="shape-icon" viewBox="0 0 48 48" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false"><polygon points="' + pts(poly) + '" fill="none" stroke="currentColor" stroke-width="1.1"/>' +
      '<polygon points="' + pts(inner) + '" fill="none" stroke="currentColor" stroke-width="0.6" stroke-opacity="0.6"/></svg>';
  }

  var COLOR_GRADES = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
  var CLARITY_GRADES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2'];
  var CUT_GRADES = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  function seeded(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function diamond4c(o) {
    var ids = makeIds('dx', 'platinum', 'diamond');
    var tint = o.color / (COLOR_GRADES.length - 1) * 0.6;
    var contrast = 0.35 + o.cut / (CUT_GRADES.length - 1) * 0.75;
    var w = 88 * Math.cbrt(o.carat);
    var body = '<ellipse cx="120" cy="' + r(120 + w / 2 + 16) + '" rx="' + r(w * 0.55) + '" ry="5" fill="url(#' + ids.shadow + ')"/>';
    body += stone({ shape: 'round', cx: 120, cy: 120, w: w, rot: 0, grad: ids.stone, stone: 'diamond', contrast: contrast });
    if (o.cut <= 1) body += '<circle cx="120" cy="120" r="' + r(w * (o.cut === 0 ? 0.2 : 0.13)) + '" fill="#4b5560" fill-opacity="' + (o.cut === 0 ? 0.32 : 0.2) + '"/>';
    var rand = seeded(97), count = [0, 0, 1, 2, 3, 4, 6, 9, 13, 18][o.clarity], vis = [0, 0, 0.12, 0.16, 0.22, 0.28, 0.38, 0.5, 0.65, 0.8][o.clarity];
    for (var i = 0; i < count; i++) {
      var a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * w * 0.36;
      var x = 120 + Math.cos(a) * d, y = 120 + Math.sin(a) * d;
      if (i % 4 === 3) body += '<path d="M' + r(x) + ' ' + r(y) + 'l' + r(3 + rand() * 4) + ' ' + r(-2 + rand() * 3) + '" stroke="#2f2a24" stroke-opacity="' + vis + '" stroke-width="0.7"/>';
      else body += '<circle cx="' + r(x) + '" cy="' + r(y) + '" r="' + r(0.6 + rand() * (o.clarity > 7 ? 1.4 : 0.6)) + '" fill="#2f2a24" fill-opacity="' + vis + '"/>';
    }
    var title = 'Illustration: ' + o.carat + ' carat round diamond, ' + CUT_GRADES[o.cut] + ' cut, ' + COLOR_GRADES[o.color] + ' color, ' + CLARITY_GRADES[o.clarity] + ' clarity';
    return wrap(body, title, defs(ids, 'platinum', 'diamond', tint), 'jewel jewel-4c');
  }

  function estimate(guide, s) {
    if (!guide || !guide.enabled || !s.shape) return null;
    var c = Math.max(0.3, Number(s.carat) || 1);
    var stoneCost = s.origin === 'lab' ? guide.labPerCaratAt1 * Math.pow(c, guide.labExponent) : guide.naturalPerCaratAt1 * Math.pow(c, guide.naturalExponent);
    var mid = stoneCost + (guide.setting[s.style] || guide.setting.solitaire) + (guide.metal[s.metal] || 0);
    var round = function (n) { return Math.round(n / 100) * 100; };
    return { low: round(mid * (1 - guide.spread)), high: round(mid * (1 + guide.spread)) };
  }

  return {
    SHAPES: SHAPES, METALS: METALS, STYLES: STYLES, STONES: STONES, CATEGORIES: CATEGORIES,
    COLOR_GRADES: COLOR_GRADES, CLARITY_GRADES: CLARITY_GRADES, CUT_GRADES: CUT_GRADES,
    render: render, shapeIcon: shapeIcon, diamond4c: diamond4c, estimate: estimate, describe: describe, esc: esc
  };
});
