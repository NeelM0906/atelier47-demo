(function () {
  'use strict';
  var CONFIG = window.A47_CONFIG || {};
  var KEYS = { saved: 'a47.saved', brief: 'a47.brief', submissions: 'a47.submissions' };

  var store = {
    get: function (key, fallback) {
      try { var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage full or blocked: the page still works without persistence */ }
    }
  };

  var saved = {
    list: function () { return store.get(KEYS.saved, []); },
    has: function (id) { return saved.list().indexOf(id) !== -1; },
    toggle: function (id) {
      var l = saved.list(), i = l.indexOf(id);
      if (i === -1) l.push(id); else l.splice(i, 1);
      store.set(KEYS.saved, l); sync(); return i === -1;
    },
    clear: function () { store.set(KEYS.saved, []); sync(); }
  };

  function sync() {
    var n = saved.list().length;
    document.querySelectorAll('[data-saved-count]').forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
    document.querySelectorAll('.saved-link').forEach(function (el) { el.setAttribute('aria-label', n ? 'Saved pieces, ' + n + ' saved' : 'Saved pieces'); });
    document.querySelectorAll('[data-save]').forEach(function (btn) {
      var on = saved.has(btn.getAttribute('data-save'));
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var label = btn.querySelector('[data-save-label]');
      if (label) label.textContent = on ? 'Saved' : 'Save';
    });
  }

  function ref(kind) {
    var prefix = { booking: 'BK', inquiry: 'DS', service: 'SV', contact: 'MSG' }[kind] || 'A47';
    return 'A47-' + prefix + '-' + Date.now().toString(36).slice(-5).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0');
  }

  function submit(kind, payload) {
    var record = { kind: kind, ref: ref(kind), at: new Date().toISOString(), payload: payload };
    var endpoint = (CONFIG.endpoints || {})[kind];
    if (endpoint) {
      return fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(record) })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return record; });
    }
    var all = store.get(KEYS.submissions, []);
    all.push(record);
    store.set(KEYS.submissions, all);
    return new Promise(function (resolve) { setTimeout(function () { resolve(record); }, 450); });
  }

  function submissions(kind) { return store.get(KEYS.submissions, []).filter(function (s) { return !kind || s.kind === kind; }); }

  function labelFor(form, el) {
    if (el.type === 'radio') {
      var fs = el.closest('fieldset'), lg = fs && fs.querySelector('legend');
      return lg ? lg.textContent.replace(/^\d+/, '').trim() : el.name;
    }
    var l = form.querySelector('label[for="' + el.id + '"]');
    return l ? l.childNodes[0].textContent.trim() : el.name;
  }

  function validate(form) {
    var errors = [], seen = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled || seen[el.name]) return;
      var label = labelFor(form, el), msg = '';
      if (el.type === 'radio') {
        var group = form.querySelectorAll('input[name="' + el.name + '"]');
        var required = Array.prototype.some.call(group, function (r) { return r.required; });
        if (!required) return;
        seen[el.name] = true;
        if (!form.querySelector('input[name="' + el.name + '"]:checked')) msg = 'Choose an option for ' + label.toLowerCase() + '.';
      } else if (el.type === 'hidden') {
        if (el.getAttribute('data-required') && !el.value) msg = el.getAttribute('data-required');
      } else if (el.type === 'checkbox') {
        if (el.required && !el.checked) msg = 'Please confirm to continue.';
      } else if (el.type === 'file') {
        if (el.files && el.files.length > 5) msg = 'Attach up to 5 photos.';
        else if (el.files) Array.prototype.forEach.call(el.files, function (f) { if (f.size > 15 * 1024 * 1024) msg = f.name + ' is over 15 MB.'; });
      } else if (el.required && !el.value.trim()) {
        msg = el.tagName === 'SELECT' ? 'Choose ' + label.toLowerCase() + '.' : 'Enter your ' + label.toLowerCase().replace(/^your /, '') + '.';
      } else if (el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim())) {
        msg = 'Enter an email address like name@example.com.';
      } else if (el.type === 'tel' && el.value && el.value.replace(/\D/g, '').length < 7) {
        msg = 'Enter a phone number with area code.';
      }
      seen[el.name] = true;
      if (msg) errors.push({ name: el.name, message: msg, el: el });
    });
    return errors;
  }

  function showErrors(form, errors) {
    form.querySelectorAll('[data-error-for]').forEach(function (p) { p.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    var summary = form.querySelector('.form-errors');
    if (!errors.length) { if (summary) summary.hidden = true; return; }
    errors.forEach(function (e) {
      var p = form.querySelector('[data-error-for="' + e.name + '"]');
      if (p) p.textContent = e.message;
      form.querySelectorAll('[name="' + e.name + '"]').forEach(function (el) { if (el.type !== 'hidden') el.setAttribute('aria-invalid', 'true'); });
    });
    if (summary) {
      var ul = summary.querySelector('ul');
      ul.innerHTML = '';
      errors.forEach(function (e) {
        var target = e.el.type === 'hidden' ? form.querySelector('[data-focus-for="' + e.name + '"]') || e.el : e.el;
        var li = document.createElement('li'), a = document.createElement('a');
        a.href = '#' + (target.id || ''); a.textContent = e.message;
        a.addEventListener('click', function (ev) { ev.preventDefault(); target.focus(); target.scrollIntoView({ block: 'center' }); });
        li.appendChild(a); ul.appendChild(li);
      });
      summary.hidden = false;
      summary.focus();
    }
  }

  function serialize(form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
      if (el.type === 'file') { out[el.name] = Array.prototype.map.call(el.files || [], function (f) { return { name: f.name, size: f.size, type: f.type }; }); return; }
      out[el.name] = el.value.trim();
    });
    return out;
  }

  function wireForm(form) {
    var kind = form.getAttribute('data-form');
    form.addEventListener('input', clearOne);
    form.addEventListener('change', clearOne);
    function clearOne(e) {
      var name = e.target.name; if (!name) return;
      var p = form.querySelector('[data-error-for="' + name + '"]');
      if (p && p.textContent) { p.textContent = ''; form.querySelectorAll('[name="' + name + '"]').forEach(function (el) { el.removeAttribute('aria-invalid'); }); }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errors = validate(form);
      showErrors(form, errors);
      if (errors.length) return;
      var payload = serialize(form);
      if (typeof form.a47Augment === 'function') payload = form.a47Augment(payload) || payload;
      var btn = form.querySelector('[type="submit"]'), original = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending…';
      submit(kind, payload).then(function (record) {
        var panel = document.querySelector('[data-success-for="' + form.id + '"]');
        if (panel) {
          panel.querySelectorAll('[data-ref]').forEach(function (el) { el.textContent = record.ref; });
          panel.querySelectorAll('[data-field]').forEach(function (el) { el.textContent = payload[el.getAttribute('data-field')] || ''; });
          form.hidden = true; panel.hidden = false;
          panel.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
          panel.focus({ preventScroll: true });
        }
        form.dispatchEvent(new CustomEvent('a47:success', { detail: record }));
      }).catch(function () {
        var summary = form.querySelector('.form-errors');
        if (summary) {
          summary.querySelector('ul').innerHTML = '<li>We could not send this just now. Please try again, or call ' + (CONFIG.contact ? CONFIG.contact.phone : 'us') + '.</li>';
          summary.hidden = false; summary.focus();
        }
      }).then(function () { btn.disabled = false; btn.textContent = original; });
    });
  }

  function nav() {
    var toggle = document.querySelector('.menu-toggle'), menu = document.getElementById('primary-nav');
    if (!toggle || !menu) return;
    function set(open) { toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); menu.classList.toggle('is-open', open); }
    toggle.addEventListener('click', function () { set(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { set(false); toggle.focus(); } });
    matchMedia('(min-width: 1081px)').addEventListener('change', function (m) { if (m.matches) set(false); });
    var header = document.querySelector('.site-header');
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    els.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });
  }

  window.A47 = { config: CONFIG, store: store, keys: KEYS, saved: saved, submit: submit, submissions: submissions, sync: sync, root: '' };

  document.addEventListener('DOMContentLoaded', function () {
    window.A47.root = document.body.getAttribute('data-root') || '';
    nav();
    reveal();
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-save]');
      if (!btn) return;
      e.preventDefault();
      saved.toggle(btn.getAttribute('data-save'));
    });
    document.querySelectorAll('form[data-form]').forEach(wireForm);
    var files = document.getElementById('s-photos'), list = document.getElementById('file-list');
    if (files && list) files.addEventListener('change', function () {
      list.innerHTML = '';
      Array.prototype.forEach.call(files.files, function (f) { var li = document.createElement('li'); li.textContent = f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + ' KB)'; list.appendChild(li); });
    });
    sync();
  });
})();
