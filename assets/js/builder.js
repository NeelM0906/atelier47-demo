(function () {
  'use strict';
  var BUDGET_RANGES = { 'under-10k': [0, 10000], '10-25k': [10000, 25000], '25-50k': [25000, 50000], '50k-plus': [50000, Infinity] };
  var FIELDS = ['shape', 'carat', 'origin', 'metal', 'style', 'budget', 'timeline', 'ringSize'];

  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('builder-form'), J = window.A47Jewelry, A = window.A47;
    if (!form || !J || !A) return;
    var stage = document.getElementById('ring-preview'), caption = document.getElementById('preview-caption');
    var out = document.getElementById('carat-out'), mmEl = document.getElementById('carat-mm');
    var estV = document.getElementById('estimate-value'), estB = document.getElementById('estimate-budget');
    var guide = A.config.pricingGuide;

    function setValue(name, value) {
      if (value === undefined || value === null || value === '') return;
      var el = form.elements[name];
      if (!el) return;
      if (el instanceof RadioNodeList || (el.length && el[0] && el[0].type === 'radio')) {
        Array.prototype.forEach.call(el, function (r) { r.checked = r.value === String(value); });
      } else el.value = value;
    }

    function read() {
      var s = {};
      FIELDS.forEach(function (k) {
        var el = form.elements[k];
        if (!el) return;
        s[k] = el.value;
      });
      s.carat = parseFloat(s.carat) || 1;
      return s;
    }

    function piece(s) {
      return { category: 'ring', shape: s.shape || 'round', carat: s.carat, metal: s.metal || 'platinum', style: s.style || 'solitaire', stone: 'diamond', sideShape: s.shape === 'oval' ? 'pear' : 'oval', className: 'jewel' };
    }

    function dims(s) {
      var spec = J.SHAPES[s.shape] || J.SHAPES.round, d = 6.4 * Math.cbrt(s.carat);
      if (spec.ratio === 1) return 'About ' + d.toFixed(1) + ' mm across face-up.';
      return 'About ' + (d * Math.sqrt(spec.ratio)).toFixed(1) + ' by ' + (d / Math.sqrt(spec.ratio)).toFixed(1) + ' mm face-up.';
    }

    function estimate(s) {
      if (!guide || !guide.enabled) return;
      var origin = s.origin === 'lab' ? 'lab' : 'natural';
      var e = J.estimate(guide, { shape: s.shape, carat: s.carat, origin: origin, style: s.style, metal: s.metal });
      if (!e) return;
      var text = money(e.low) + ' to ' + money(e.high);
      if (s.origin === 'undecided') {
        var lab = J.estimate(guide, { shape: s.shape, carat: s.carat, origin: 'lab', style: s.style, metal: s.metal });
        text = money(e.low) + ' to ' + money(e.high) + ' natural';
        estB.textContent = 'Lab-grown from about ' + money(lab.low) + '.';
      } else estB.textContent = '';
      estV.textContent = text;
      var band = BUDGET_RANGES[s.budget];
      if (band && s.origin !== 'undecided') {
        if (e.low > band[1]) estB.textContent = 'Above this budget. A lab-grown center or a slightly smaller stone would bring it in.';
        else if (e.high < band[0]) estB.textContent = 'Comfortably within this budget. Room for a higher grade stone.';
        else estB.textContent = 'Fits this budget.';
      }
    }

    var saveTimer;
    function update() {
      var s = read();
      stage.innerHTML = J.render(piece(s), 'bld');
      caption.textContent = J.describe(piece(s)).replace('Illustration: ', '');
      out.textContent = s.carat.toFixed(1) + ' ct';
      form.elements.carat.setAttribute('aria-valuetext', s.carat.toFixed(1) + ' carats');
      mmEl.textContent = dims(s);
      estimate(s);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { s.from = form.elements.from.value; s.updatedAt = new Date().toISOString(); A.store.set(A.keys.brief, s); }, 250);
    }

    var params = new URLSearchParams(location.search), from = params.get('from');
    var preset = from && (window.A47_COMMISSIONS || []).filter(function (p) { return p.id === from; })[0];
    var brief = A.store.get(A.keys.brief, null);
    if (preset) {
      ['shape', 'metal', 'style', 'budget'].forEach(function (k) { setValue(k, preset[k]); });
      setValue('carat', preset.carat);
      setValue('origin', preset.origin);
      form.elements.from.value = preset.id;
      var lede = document.querySelector('.page-head .lede');
      if (lede) lede.textContent = 'Starting from ' + preset.title + '. Change anything you like. The preview updates as you go.';
    } else if (brief) {
      FIELDS.forEach(function (k) { setValue(k, brief[k]); });
    }

    form.addEventListener('input', update);
    form.addEventListener('change', update);

    form.a47Augment = function (payload) {
      var s = read();
      payload.brief = s;
      payload.summary = J.describe(piece(s)).replace('Illustration: ', '');
      payload.estimate = estV.textContent;
      return payload;
    };
    form.addEventListener('a47:success', function (e) {
      var link = document.querySelector('[data-wa-brief]');
      var text = 'Hello, I just sent design brief ' + e.detail.ref + ': ' + e.detail.payload.summary + '. Budget: ' + (e.detail.payload.budget || 'not sure') + '.';
      if (link) link.href = 'https://wa.me/' + A.config.contact.whatsapp + '?text=' + encodeURIComponent(text);
    });
    update();
  });
})();
