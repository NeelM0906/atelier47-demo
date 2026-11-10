(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('filters');
    if (!form) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('#piece-grid .piece'));
    var count = document.getElementById('result-count'), empty = document.getElementById('empty-state');
    var keys = ['category', 'shape', 'metal', 'style', 'budget'];
    var params = new URLSearchParams(location.search);
    keys.forEach(function (k) {
      var v = params.get(k), sel = form.elements[k];
      if (v && sel.querySelector('option[value="' + CSS.escape(v) + '"]')) sel.value = v;
    });

    function apply() {
      var active = {}, shown = 0;
      keys.forEach(function (k) { if (form.elements[k].value) active[k] = form.elements[k].value; });
      cards.forEach(function (card) {
        var ok = Object.keys(active).every(function (k) { return card.getAttribute('data-' + k) === active[k]; });
        card.hidden = !ok;
        if (ok) { shown++; card.classList.add('is-in'); }
      });
      var n = Object.keys(active).length;
      count.textContent = n ? 'Showing ' + shown + ' of ' + cards.length + ' commissions' : 'Showing all ' + cards.length + ' commissions';
      empty.hidden = shown !== 0;
      var q = new URLSearchParams(active).toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
    }
    form.addEventListener('change', apply);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('reset', function () { setTimeout(apply, 0); });
    document.querySelectorAll('[data-reset-filters]').forEach(function (b) { b.addEventListener('click', function () { form.reset(); }); });
    apply();
  });
})();
