(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('saved-grid'), J = window.A47Jewelry, A = window.A47;
    if (!grid || !J || !A) return;
    var byId = {};
    (window.A47_COMMISSIONS || []).forEach(function (p) { byId[p.id] = p; });
    var heart = '<svg class="i" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
    function render() {
      var ids = A.saved.list().filter(function (id) { return byId[id]; });
      grid.innerHTML = ids.map(function (id) {
        var p = byId[id], e = J.esc;
        return '<article class="piece is-in"><a class="piece-link" href="' + A.root + 'work/' + p.id + '.html"><div class="piece-media">' + J.render(p, 's' + p.id) + '</div><div class="piece-body"><h2 class="piece-title">' + e(p.title) + '</h2><p class="piece-meta">' + e(p.summary) + '</p></div></a>' +
          '<button class="save-btn" type="button" data-save="' + p.id + '" aria-pressed="true"><span class="visually-hidden">Remove ' + e(p.title) + ' from saved</span>' + heart + '</button></article>';
      }).join('');
      document.getElementById('saved-empty').hidden = ids.length > 0;
      document.getElementById('saved-actions').hidden = ids.length === 0;
    }
    document.addEventListener('click', function (e) { if (e.target.closest('[data-save]')) setTimeout(render, 0); });
    document.getElementById('saved-clear').addEventListener('click', function () { A.saved.clear(); render(); });
    render();
  });
})();
