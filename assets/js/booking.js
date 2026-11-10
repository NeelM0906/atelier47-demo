(function () {
  'use strict';
  var DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function parse(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function minutes(t) { var p = t.split(':').map(Number); return p[0] * 60 + p[1]; }
  function time12(t) { var p = t.split(':').map(Number), ap = p[0] >= 12 ? 'pm' : 'am', h = ((p[0] + 11) % 12) + 1; return p[1] ? h + ':' + String(p[1]).padStart(2, '0') + ' ' + ap : h + ' ' + ap; }
  function longDate(d) { return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('booking-form'), A = window.A47;
    if (!form || !A) return;
    var cons = A.config.consultation, hours = A.config.contact.hours;
    var cal = document.getElementById('calendar'), slotsEl = document.getElementById('slots'), hint = document.getElementById('slot-hint');

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var first = new Date(today); first.setDate(first.getDate() + cons.leadDays);
    var last = new Date(today); last.setDate(last.getDate() + cons.windowDays);

    function duration() { return form.elements.mode.value === 'virtual' ? cons.virtualDurationMinutes : cons.durationMinutes; }
    function hoursFor(d) { var code = DOW[d.getDay()]; return hours.filter(function (h) { return !h.closed && h.days.indexOf(code) !== -1; })[0]; }
    function taken(dateStr) {
      return A.submissions('booking').filter(function (s) { return s.payload.date === dateStr; }).map(function (s) { return s.payload.time; });
    }
    function slotsFor(d) {
      var h = hoursFor(d); if (!h) return [];
      var busy = taken(iso(d)), dur = duration();
      return cons.slotTimes.filter(function (t) { return minutes(t) >= minutes(h.opens) && minutes(t) + dur <= minutes(h.closes); })
        .map(function (t) { return { time: t, free: busy.indexOf(t) === -1 }; });
    }
    function bookable(d) { return d >= first && d <= last && slotsFor(d).some(function (s) { return s.free; }); }

    var input = document.createElement('input');
    input.type = 'hidden'; input.name = 'date'; input.setAttribute('data-required', 'Choose a day for your consultation.');
    var view = new Date(first.getFullYear(), first.getMonth(), 1);
    var focusDate = null;

    function renderCalendar() {
      var y = view.getFullYear(), m = view.getMonth();
      var start = new Date(y, m, 1), daysIn = new Date(y, m + 1, 0).getDate();
      var canPrev = new Date(y, m, 0) >= first, canNext = new Date(y, m + 1, 1) <= last;
      var html = '<div class="cal-head"><p class="cal-title" id="cal-title" aria-live="polite">' + MONTHS[m] + ' ' + y + '</p><div class="cal-nav">' +
        '<button type="button" data-cal="-1" aria-label="Previous month"' + (canPrev ? '' : ' disabled') + '><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>' +
        '<button type="button" data-cal="1" aria-label="Next month"' + (canNext ? '' : ' disabled') + '><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button></div></div>';
      html += '<div class="cal-grid" role="group" aria-labelledby="cal-title">';
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (d, i) { html += '<span class="cal-dow" aria-hidden="true" title="' + DAYS[i] + '">' + d + '</span>'; });
      for (var p = 0; p < start.getDay(); p++) html += '<span class="cal-pad" aria-hidden="true"></span>';
      var tabSet = false, selected = input.value;
      for (var day = 1; day <= daysIn; day++) {
        var d = new Date(y, m, day), ok = bookable(d), ds = iso(d);
        var isSel = selected === ds;
        var reason = ok ? '' : (!hoursFor(d) ? ', closed' : (d < first || d > last ? ', not available' : ', fully booked'));
        var tab = ok && (isSel || (!selected && !tabSet)) ? '0' : '-1';
        if (tab === '0') tabSet = true;
        html += '<button type="button" class="cal-day' + (ds === iso(today) ? ' is-today' : '') + '" data-date="' + ds + '" aria-pressed="' + isSel + '" tabindex="' + tab + '" aria-label="' + longDate(d) + reason + '"' + (ok ? '' : ' disabled') + (tabSet && tab === '0' ? ' data-focus-for="date" id="cal-focus"' : '') + '>' + day + '</button>';
      }
      html += '</div>';
      cal.innerHTML = html;
      cal.appendChild(input);
      if (focusDate) { var f = cal.querySelector('[data-date="' + focusDate + '"]'); if (f) f.focus(); focusDate = null; }
    }

    function renderSlots() {
      var prev = form.elements.time ? (form.querySelector('input[name="time"]:checked') || {}).value : '';
      if (!input.value) { slotsEl.innerHTML = ''; hint.textContent = 'Pick a day to see open times. All times are New York time.'; return; }
      var d = parse(input.value), list = slotsFor(d), free = list.filter(function (s) { return s.free; }).length;
      hint.textContent = longDate(d) + '. ' + free + (free === 1 ? ' time' : ' times') + ' open, ' + duration() + ' minutes each, New York time.';
      slotsEl.innerHTML = list.map(function (s, i) {
        var checked = s.free && s.time === prev ? ' checked' : '';
        return '<label class="choice"><input type="radio" name="time" value="' + s.time + '"' + (i === 0 ? ' required' : '') + (s.free ? '' : ' disabled') + checked + '><span class="choice-face"><span class="choice-label">' + time12(s.time) + (s.free ? '' : '<span class="visually-hidden">, taken</span>') + '</span></span></label>';
      }).join('');
    }

    cal.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-cal]');
      if (nav) { view.setMonth(view.getMonth() + Number(nav.getAttribute('data-cal'))); renderCalendar(); return; }
      var btn = e.target.closest('.cal-day');
      if (!btn || btn.disabled) return;
      input.value = btn.getAttribute('data-date');
      focusDate = input.value;
      var err = form.querySelector('[data-error-for="date"]'); if (err) err.textContent = '';
      renderCalendar(); renderSlots();
    });
    cal.addEventListener('keydown', function (e) {
      var btn = e.target.closest('.cal-day'); if (!btn) return;
      var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!step) return;
      e.preventDefault();
      var d = parse(btn.getAttribute('data-date'));
      for (var i = 0; i < 31; i++) {
        d.setDate(d.getDate() + (i === 0 ? step : Math.sign(step)));
        if (d < first || d > last) return;
        if (bookable(d)) break;
      }
      if (d.getMonth() !== view.getMonth()) view = new Date(d.getFullYear(), d.getMonth(), 1);
      var target = iso(d);
      renderCalendar();
      var t = cal.querySelector('[data-date="' + target + '"]');
      if (t) { cal.querySelectorAll('.cal-day').forEach(function (b) { b.tabIndex = -1; }); t.tabIndex = 0; t.focus(); }
    });
    form.addEventListener('change', function (e) { if (e.target.name === 'mode') { renderCalendar(); renderSlots(); } });

    var brief = A.store.get(A.keys.brief, null), saved = A.saved.list(), byId = {};
    (window.A47_COMMISSIONS || []).forEach(function (p) { byId[p.id] = p; });
    var items = [];
    if (brief && brief.shape) items.push('Your design brief: ' + brief.carat + ' ct ' + brief.shape + ', ' + (window.A47Jewelry.METALS[brief.metal] || {}).label + ', ' + (window.A47Jewelry.STYLES[brief.style] || {}).label.toLowerCase());
    saved.forEach(function (id) { if (byId[id]) items.push('Saved: ' + byId[id].title); });
    if (items.length) {
      document.getElementById('attachments').hidden = false;
      document.getElementById('attachment-list').innerHTML = items.map(function (t) { var li = document.createElement('li'); li.textContent = t; return li.outerHTML; }).join('');
    }
    if (brief && brief.shape && new URLSearchParams(location.search).get('brief')) {
      var type = form.querySelector('input[name="type"][value="engagement"]'); if (type) type.checked = true;
    }

    form.a47Augment = function (payload) {
      payload.durationMinutes = duration();
      payload.timezone = 'America/New_York';
      if (items.length) { payload.brief = brief; payload.saved = saved; }
      return payload;
    };

    var last_record = null;
    form.addEventListener('a47:success', function (e) {
      last_record = e.detail;
      var p = e.detail.payload, d = parse(p.date);
      var typeLabel = (cons.types.filter(function (t) { return t.id === p.type; })[0] || {}).label;
      var rows = [['Consultation', typeLabel], ['Where', p.mode === 'virtual' ? 'Video call. Link sent with your confirmation.' : A.config.contact.address.street], ['Date', longDate(d) + ', ' + d.getFullYear()], ['Time', time12(p.time) + ' New York time, ' + p.durationMinutes + ' minutes'], ['Retainer', '$' + cons.retainer + ', credited to your commission']];
      document.getElementById('booking-summary').innerHTML = rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + window.A47Jewelry.esc(r[1]) + '</dd></div>'; }).join('');
      document.querySelector('.booking-aside').hidden = true;
    });

    document.getElementById('ics-download').addEventListener('click', function () {
      if (!last_record) return;
      var p = last_record.payload, start = p.date.replace(/-/g, '') + 'T' + p.time.replace(':', '') + '00';
      var endMin = minutes(p.time) + p.durationMinutes, end = p.date.replace(/-/g, '') + 'T' + String(Math.floor(endMin / 60)).padStart(2, '0') + String(endMin % 60).padStart(2, '0') + '00';
      var name = A.config.brand.name, addr = A.config.contact.address;
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//' + name + '//Consultation//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
        'UID:' + last_record.ref + '@' + name.toLowerCase(), 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''),
        'DTSTART;TZID=America/New_York:' + start, 'DTEND;TZID=America/New_York:' + end,
        'SUMMARY:' + name + ' consultation (' + last_record.ref + ')',
        'LOCATION:' + (p.mode === 'virtual' ? 'Video call' : (addr.street + ', ' + addr.locality + ' ' + addr.region + ' ' + addr.postalCode).replace(/,/g, '\\,')),
        'DESCRIPTION:Requested consultation. ' + A.config.contact.phone, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = name.toLowerCase() + '-consultation.ics';
      document.body.appendChild(a); a.click(); a.remove();
    });

    for (var d0 = new Date(first); d0 <= last; d0.setDate(d0.getDate() + 1)) {
      if (bookable(d0)) { input.value = iso(d0); view = new Date(d0.getFullYear(), d0.getMonth(), 1); break; }
    }
    renderCalendar();
    renderSlots();
  });
})();
