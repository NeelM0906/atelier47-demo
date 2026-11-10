'use strict';

module.exports = function pages({ config, content, J, h }) {
  const { esc, money, time12, BUDGETS } = h;
  const b = config.brand, c = config.contact, cons = config.consultation;
  const byId = Object.fromEntries(content.commissions.map((p) => [p.id, p]));
  const allSteps = content.process.flatMap((ph) => ph.steps.map((s) => ({ ...s, phase: ph.phase })));
  const wa = (text) => `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(text)}`;
  const icon = {
    arrow: '<svg class="i" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    heart: '<svg class="i" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>'
  };

  const spec = (p) => `${p.carat} ct ${J.SHAPES[p.shape].label.toLowerCase()} · ${J.METALS[p.metal].label}`;

  const pieceCard = (p, R, heading = 'h3') => `<article class="piece reveal" data-id="${p.id}" data-category="${p.category}" data-shape="${p.shape}" data-metal="${p.metal}" data-style="${p.style}" data-budget="${p.budget}" data-origin="${p.origin}">
  <a class="piece-link" href="${R}work/${p.id}.html">
    <div class="piece-media">${J.render(p, 'c' + p.id)}</div>
    <div class="piece-body">
      <${heading} class="piece-title">${esc(p.title)}</${heading}>
      <p class="piece-meta">${esc(spec(p))}</p>
      <p class="piece-meta">${esc(J.STYLES[p.style].label)} · ${p.origin === 'lab' ? 'Lab-grown' : 'Natural'} ${esc(J.STONES[p.stone].label.toLowerCase())}</p>
    </div>
  </a>
  <button class="save-btn" type="button" data-save="${p.id}" aria-pressed="false"><span class="visually-hidden">Save ${esc(p.title)}</span>${icon.heart}</button>
</article>`;

  const pageHead = (eyebrow, title, lede, extra = '') => `<section class="page-head">
  <div class="wrap narrow">
    <p class="eyebrow">${esc(eyebrow)}</p>
    <h1 class="display">${title}</h1>
    ${lede ? `<p class="lede">${lede}</p>` : ''}
    ${extra}
  </div>
</section>`;

  const crumbs = (R, items) => `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol>${items.map(([label, href], i) => i === items.length - 1 ? `<li aria-current="page">${esc(label)}</li>` : `<li><a href="${R}${href}">${esc(label)}</a></li>`).join('')}</ol></nav>`;

  const bookBand = (R, heading = 'Sit down with the people who will make it.') => `<section class="section book-band">
  <div class="wrap book-band-inner">
    <div>
      <p class="eyebrow on-dark">Consultations</p>
      <h2 class="display-2">${heading}</h2>
      <p>${esc(cons.durationMinutes)} minutes in the atelier or ${esc(cons.virtualDurationMinutes)} minutes on video. ${esc(money(cons.retainer))} retainer, credited in full to your piece.</p>
    </div>
    <div class="book-band-actions">
      <a class="btn btn-light" href="${R}book.html">Book a consultation</a>
      <a class="btn btn-ghost-light" href="${R}design.html">Design your ring first</a>
    </div>
  </div>
</section>`;

  const field = (name, label, opts = {}) => {
    const id = (opts.idPrefix || 'f') + '-' + name;
    const req = opts.required ? ' required' : '';
    const hint = opts.hint ? `<p class="hint" id="${id}-hint">${opts.hint}</p>` : '';
    const describedby = [opts.hint ? id + '-hint' : '', id + '-err'].filter(Boolean).join(' ');
    let control;
    if (opts.type === 'textarea') control = `<textarea id="${id}" name="${name}" rows="${opts.rows || 4}"${req} aria-describedby="${describedby}"${opts.max ? ` maxlength="${opts.max}"` : ''}></textarea>`;
    else if (opts.type === 'select') control = `<select id="${id}" name="${name}"${req} aria-describedby="${describedby}">${opts.options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`;
    else control = `<input id="${id}" name="${name}" type="${opts.type || 'text'}"${req}${opts.autocomplete ? ` autocomplete="${opts.autocomplete}"` : ''}${opts.attrs || ''} aria-describedby="${describedby}">`;
    return `<div class="field${opts.wide ? ' field-wide' : ''}"><label for="${id}">${esc(label)}${opts.required ? '' : ' <span class="optional">optional</span>'}</label>${hint}${control}<p class="field-error" id="${id}-err" data-error-for="${name}"></p></div>`;
  };

  const choices = (name, legend, items, opts = {}) => `<fieldset class="choice-set${opts.cls ? ' ' + opts.cls : ''}"${opts.required ? ' data-required="true"' : ''} aria-describedby="err-${name}">
  <legend>${opts.step ? `<span class="step-n">${opts.step}</span>` : ''}${esc(legend)}</legend>
  ${opts.hint ? `<p class="hint">${opts.hint}</p>` : ''}
  <div class="choices">
    ${items.map(([v, l, extra], i) => `<label class="choice"><input type="radio" name="${name}" value="${esc(v)}"${opts.checked === v ? ' checked' : ''}${opts.required && i === 0 ? ' required' : ''}><span class="choice-face">${extra || ''}<span class="choice-label">${esc(l)}</span></span></label>`).join('')}
  </div>
  <p class="field-error" id="err-${name}" data-error-for="${name}"></p>
</fieldset>`;

  const contactFields = (prefix, phoneRequired) => [
    field('name', 'Full name', { required: true, autocomplete: 'name', idPrefix: prefix }),
    field('email', 'Email', { required: true, type: 'email', autocomplete: 'email', idPrefix: prefix }),
    field('phone', 'Phone or WhatsApp', { required: !!phoneRequired, type: 'tel', autocomplete: 'tel', idPrefix: prefix })
  ].join('');

  const errorSummary = '<div class="form-errors" role="alert" tabindex="-1" hidden><p>Please check the following:</p><ul></ul></div>';

  const hoursTable = () => `<table class="hours-table"><caption class="visually-hidden">Opening hours</caption><tbody>${c.hours.map((x) => `<tr><th scope="row">${esc(x.label)}</th><td>${x.closed ? 'Closed' : `${time12(x.opens)} to ${time12(x.closes)}`}</td></tr>`).join('')}</tbody></table>`;

  const metalSwatch = (k) => `<span class="swatch swatch-${k}" aria-hidden="true"></span>`;

  const map = () => `<figure class="map">
<svg viewBox="0 0 640 360" role="img" aria-labelledby="map-t map-d" xmlns="http://www.w3.org/2000/svg">
  <title id="map-t">Map of West 47th Street between Fifth and Sixth Avenues</title>
  <desc id="map-d">${esc(b.name)} is mid-block on the north side of West 47th Street, between Fifth Avenue to the east and Sixth Avenue to the west. The B, D, F and M trains stop at Sixth Avenue and 47th to 50th Streets.</desc>
  <rect width="640" height="360" fill="var(--linen)"/>
  <g fill="var(--paper)" stroke="var(--line)">
    <rect x="70" y="30" width="500" height="80"/><rect x="70" y="150" width="500" height="80"/><rect x="70" y="270" width="500" height="60"/>
  </g>
  <g fill="none" stroke="var(--graphite)" stroke-width="1">
    <line x1="60" y1="20" x2="60" y2="340"/><line x1="580" y1="20" x2="580" y2="340"/>
  </g>
  <g font-family="Geist, system-ui, sans-serif" font-size="12" fill="var(--graphite)" letter-spacing="1.5">
    <text x="320" y="135" text-anchor="middle">W 47TH ST</text>
    <text x="320" y="255" text-anchor="middle">W 46TH ST</text>
    <text x="320" y="20" text-anchor="middle">W 48TH ST</text>
    <text x="48" y="190" text-anchor="middle" transform="rotate(-90 48 190)">SIXTH AVE</text>
    <text x="596" y="190" text-anchor="middle" transform="rotate(90 596 190)">FIFTH AVE</text>
  </g>
  <g font-family="Geist, system-ui, sans-serif" font-size="10" letter-spacing="1">
    <rect x="72" y="38" width="96" height="20" rx="10" fill="var(--ink)"/><text x="120" y="52" text-anchor="middle" fill="var(--paper)">B D F M TRAINS</text>
    <path d="M72 48 H64" stroke="var(--ink)" stroke-width="1"/>
  </g>
  <g>
    <circle cx="330" cy="100" r="22" fill="var(--champagne)" fill-opacity="0.25"/>
    <circle cx="330" cy="100" r="8" fill="var(--ink)"/>
    <rect x="352" y="64" width="176" height="40" rx="2" fill="var(--ink)"/>
    <text x="364" y="82" font-family="Newsreader, Georgia, serif" font-size="15" fill="var(--paper)">${esc(b.name)}</text>
    <text x="364" y="97" font-family="Geist, system-ui, sans-serif" font-size="10" fill="var(--champagne)" letter-spacing="1">${esc(c.address.street.split(',')[1] || '').trim().toUpperCase()}</text>
  </g>
</svg>
<figcaption>Schematic map, not to scale.</figcaption>
</figure>`;

  const teamPortrait = (m, i) => {
    const initials = m.name.split(' ').map((s) => s[0]).join('');
    const hue = ['#E9E1D3', '#E4DCCF', '#EAE3D6', '#E2D9CA', '#E7DFD1'][i % 5];
    return `<svg class="portrait" viewBox="0 0 300 360" role="img" aria-label="Portrait placeholder for ${esc(m.name)}" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="360" fill="${hue}"/><circle cx="150" cy="168" r="96" fill="none" stroke="var(--champagne)" stroke-width="0.8"/><circle cx="150" cy="168" r="104" fill="none" stroke="var(--champagne)" stroke-opacity="0.5" stroke-width="0.5"/><text x="150" y="190" text-anchor="middle" font-family="Newsreader, Georgia, serif" font-size="64" font-weight="300" fill="var(--graphite)">${esc(initials)}</text><text x="150" y="330" text-anchor="middle" font-family="Geist, system-ui, sans-serif" font-size="11" letter-spacing="2" fill="var(--muted)">PHOTO PLACEHOLDER</text></svg>`;
  };

  const home = (R) => {
    const hero = byId['the-montauk-oval'];
    const featured = content.commissions.filter((p) => p.featured).slice(0, 6);
    return `<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow">Private atelier · West 47th Street · Since ${b.founded}</p>
      <h1 class="display hero-title">Made with you,<br><em>on 47th Street.</em></h1>
      <p class="lede">Custom engagement rings and fine jewelry, designed across the table from you and made by hand in our suite upstairs. One designer, one setter, one advisor. Names you will know by the end of the first hour.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${R}book.html">Book a consultation</a>
        <a class="btn btn-ghost" href="${R}design.html">Design your ring ${icon.arrow}</a>
      </div>
      <p class="hero-note">${money(cons.retainer)} design retainer, credited in full to your ring. In person or on video.</p>
    </div>
    <figure class="hero-figure">
      <div class="hero-stage">${J.render({ ...hero, className: 'jewel hero-jewel' }, 'hero')}</div>
      <figcaption><a href="${R}work/${hero.id}.html">${esc(hero.title)}</a>. ${esc(spec(hero))}. Illustration.</figcaption>
    </figure>
  </div>
</section>

<section class="trust" aria-label="Our standards">
  <div class="wrap trust-grid">
    <div class="trust-item"><p class="trust-k">GIA or IGI</p><p>Independent grading report with every center diamond</p></div>
    <div class="trust-item"><p class="trust-k">Kimberley Process</p><p>Suppliers under the System of Warranties</p></div>
    <div class="trust-item"><p class="trust-k">Made in Suite 1200</p><p>Designed, set and finished in house</p></div>
    <div class="trust-item"><p class="trust-k">Lifetime care</p><p>Free cleaning and prong checks for anything we make</p></div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">The process</p>
      <h2 class="display-2">Five steps. About six weeks.</h2>
      <p class="section-lede">You approve every stage before we move to the next. Nothing is cast until you have turned the 3D model in your hand.</p>
    </div>
    <ol class="steps">
      ${content.process.map((ph, i) => `<li class="step reveal"><span class="step-num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(ph.phase)}</h3><p class="step-when">${esc(ph.when)}</p><p>${esc(ph.summary)}</p></li>`).join('')}
    </ol>
    <p class="section-foot"><a class="link" href="${R}process.html">See the full process and payment schedule ${icon.arrow}</a></p>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    <div class="section-head split">
      <div>
        <p class="eyebrow">Selected commissions</p>
        <h2 class="display-2">Each one made for one person.</h2>
      </div>
      <a class="link" href="${R}collections.html">View all ${content.commissions.length} commissions ${icon.arrow}</a>
    </div>
    <div class="piece-grid">${featured.map((p) => pieceCard(p, R)).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="wrap craft">
    <div class="craft-copy">
      <p class="eyebrow">Craft and materials</p>
      <h2 class="display-2">Everything but the casting happens at our benches.</h2>
      <p>Six benches, one microscope setting station and a laser welder, twelve floors above the street. Casting is done by a partner casting house in the same building, and every piece comes back to us for finishing, setting and polish.</p>
      <dl class="materials">
        <div><dt>${metalSwatch('platinum')}Platinum 950</dt><dd>Naturally white, dense and hypoallergenic. Our default for diamond heads.</dd></div>
        <div><dt>${metalSwatch('yellow')}18k yellow gold</dt><dd>Warm, rich color. 75 percent pure gold, alloyed for strength.</dd></div>
        <div><dt>${metalSwatch('rose')}18k rose gold</dt><dd>Copper in the alloy gives the blush. Softer on fair and olive skin.</dd></div>
        <div><dt>${metalSwatch('white')}18k white gold</dt><dd>Lighter than platinum and rhodium finished. Recycled gold on request.</dd></div>
      </dl>
    </div>
    <figure class="craft-figure">
      <div class="craft-stage">${J.render({ ...byId['fifth-avenue-cushion'], className: 'jewel' }, 'craft').replace('viewBox="0 0 240 240"', 'viewBox="66 26 108 108"')}</div>
      <figcaption>Micro-pavé halo, 22 stones set under the microscope. Illustration.</figcaption>
    </figure>
  </div>
</section>

<section class="section section-tint">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">In their words</p>
      <h2 class="display-2">What clients remember.</h2>
    </div>
    <div class="quotes">
      ${content.testimonials.map((t) => `<figure class="quote reveal"><blockquote><p>${esc(t.quote)}</p></blockquote><figcaption><span class="quote-name">${esc(t.name)}</span><span class="quote-ctx">${esc(t.context)}</span></figcaption></figure>`).join('')}
    </div>
    ${config.demo ? '<p class="demo-label">Sample reviews for the demo. Replace with verified client reviews.</p>' : ''}
  </div>
</section>

<section class="section">
  <div class="wrap visit">
    <div>
      <p class="eyebrow">Visit the atelier</p>
      <h2 class="display-2">Upstairs, by appointment.</h2>
      <address class="visit-address">${esc(c.address.street)}<br>${esc(c.address.locality)}, ${esc(c.address.region)} ${esc(c.address.postalCode)}</address>
      ${hoursTable()}
      <p class="small">${esc(c.entryNote)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${R}book.html">Book a consultation</a>
        <a class="btn btn-ghost" href="${R}contact.html">Directions ${icon.arrow}</a>
      </div>
    </div>
    ${map()}
  </div>
</section>`;
  };

  const collections = (R) => {
    const opts = (obj) => Object.entries(obj).map(([k, v]) => `<option value="${k}">${esc(typeof v === 'string' ? v : v.label)}</option>`).join('');
    const used = (key) => new Set(content.commissions.map((p) => p[key]));
    const pick = (obj, key) => Object.fromEntries(Object.entries(obj).filter(([k]) => used(key).has(k)));
    return `${pageHead('Portfolio', 'Past commissions', `${content.commissions.length} pieces made for clients since 2023. Filter by what you are drawn to, save the ones you love, and bring them to your consultation.`)}
<section class="section-sm">
  <div class="wrap">
    <form class="filters" id="filters" aria-label="Filter commissions">
      <div class="filter"><label for="flt-category">Piece</label><select id="flt-category" name="category"><option value="">All pieces</option>${opts(pick(J.CATEGORIES, 'category'))}</select></div>
      <div class="filter"><label for="flt-shape">Stone shape</label><select id="flt-shape" name="shape"><option value="">All shapes</option>${opts(pick(J.SHAPES, 'shape'))}</select></div>
      <div class="filter"><label for="flt-metal">Metal</label><select id="flt-metal" name="metal"><option value="">All metals</option>${opts(pick(J.METALS, 'metal'))}</select></div>
      <div class="filter"><label for="flt-style">Style</label><select id="flt-style" name="style"><option value="">All styles</option>${opts(pick(J.STYLES, 'style'))}</select></div>
      <div class="filter"><label for="flt-budget">Budget</label><select id="flt-budget" name="budget"><option value="">Any budget</option>${opts(pick(BUDGETS, 'budget'))}</select></div>
      <div class="filter filter-reset"><button class="btn btn-text" type="reset">Clear filters</button></div>
    </form>
    <p class="result-count" id="result-count" aria-live="polite">Showing all ${content.commissions.length} commissions</p>
    <div class="piece-grid" id="piece-grid">${content.commissions.map((p) => pieceCard(p, R, 'h2')).join('')}</div>
    <div class="empty-state" id="empty-state" hidden>
      <p class="display-3">Nothing here yet in that combination.</p>
      <p>That usually means it is a good idea for a commission. <a class="link" href="${R}design.html">Start a design</a> or <button class="btn-text link" type="button" data-reset-filters>clear the filters</button>.</p>
    </div>
    ${config.demo ? '<p class="demo-label">Demo portfolio. Commissions and clients are fictional and images are illustrations.</p>' : ''}
  </div>
</section>
${bookBand(R)}`;
  };

  const workPage = (p, i, list) => (R) => {
    const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
    const related = list.filter((q) => q.id !== p.id && (q.shape === p.shape || q.style === p.style)).slice(0, 3);
    const relatedFill = related.concat(list.filter((q) => q.id !== p.id && !related.includes(q))).slice(0, 3);
    return `${crumbs(R, [['Home', 'index.html'], ['Commissions', 'collections.html'], [p.title, '']])}
<section class="work">
  <div class="wrap work-grid">
    <figure class="work-figure">
      <div class="work-stage">${J.render({ ...p, className: 'jewel' }, 'w' + p.id)}</div>
      <figcaption>Illustration of the finished piece.${config.demo ? ' Demo content.' : ''}</figcaption>
    </figure>
    <div class="work-copy">
      <p class="eyebrow">${esc(J.CATEGORIES[p.category])} · ${p.year}</p>
      <h1 class="display">${esc(p.title)}</h1>
      <p class="work-client">${esc(p.client)}</p>
      <p class="lede">${esc(p.summary)}</p>
      <p>${esc(p.story)}</p>
      <dl class="spec-list">
        <div><dt>Center stone</dt><dd>${p.carat} ct ${esc(J.SHAPES[p.shape].label.toLowerCase())} ${p.origin === 'lab' ? 'lab-grown' : 'natural'} ${esc(J.STONES[p.stone].label.toLowerCase())}</dd></div>
        <div><dt>Setting</dt><dd>${esc(J.STYLES[p.style].label)}</dd></div>
        <div><dt>Metal</dt><dd>${esc(J.METALS[p.metal].label)}</dd></div>
        <div><dt>Budget band</dt><dd>${esc(BUDGETS[p.budget])}</dd></div>
        <div><dt>Made in</dt><dd>${p.weeks} weeks</dd></div>
      </dl>
      <ul class="detail-list">${p.details.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
      <div class="cta-row">
        <a class="btn btn-primary" href="${R}design.html?from=${p.id}">Start a design like this</a>
        <button class="btn btn-ghost save-btn-wide" type="button" data-save="${p.id}" aria-pressed="false">${icon.heart}<span data-save-label>Save</span></button>
      </div>
      <p class="small"><a class="link link-block" href="${wa(`Hello ${b.name}, I'm interested in something like "${p.title}" (${p.carat} ct ${p.shape}, ${p.metal}).`)}" rel="noopener">Ask about this piece on WhatsApp ${icon.arrow}</a></p>
    </div>
  </div>
</section>
<nav class="wrap prevnext" aria-label="More commissions">
  <a href="${R}work/${prev.id}.html" rel="prev"><span class="small">Previous</span><span>${esc(prev.title)}</span></a>
  <a href="${R}work/${next.id}.html" rel="next"><span class="small">Next</span><span>${esc(next.title)}</span></a>
</nav>
<section class="section section-tint">
  <div class="wrap">
    <h2 class="display-2">Related commissions</h2>
    <div class="piece-grid">${relatedFill.map((q) => pieceCard(q, R)).join('')}</div>
  </div>
</section>
${bookBand(R)}`;
  };

  const design = (R) => {
    const def = { category: 'ring', shape: 'oval', carat: 1.5, metal: 'platinum', style: 'solitaire', stone: 'diamond', origin: 'natural' };
    const sizes = [['', 'Choose a size']].concat(Array.from({ length: 25 }, (_, i) => { const s = String(3 + i * 0.25); return [s, 'US ' + s]; })).concat([['unknown', 'Not sure yet']]);
    return `${pageHead('Design your ring', 'Start with what you love.', 'Choose a shape, size, metal and setting. The preview updates as you go. Send it to us and we will prepare for your consultation around it. Nothing here is binding.')}
<section class="section-sm">
  <div class="wrap builder">
    <div class="builder-preview">
      <div class="preview-card">
        <div class="preview-stage" id="ring-preview">${J.render({ ...def, className: 'jewel' }, 'bld')}</div>
        <p class="preview-caption" id="preview-caption" aria-live="polite">${esc(J.describe(def).replace('Illustration: ', ''))}</p>
        <div class="estimate" id="estimate" aria-live="polite"${config.pricingGuide.enabled ? '' : ' hidden'}>
          <p class="estimate-k">Illustrative range</p>
          <p class="estimate-v" id="estimate-value">&nbsp;</p>
          <p class="estimate-budget" id="estimate-budget"></p>
          <p class="hint">${esc(config.pricingGuide.note)}</p>
        </div>
      </div>
    </div>
    <form class="builder-form" id="builder-form" data-form="inquiry" novalidate>
      ${errorSummary}
      <input type="hidden" name="source" value="design-your-ring">
      <input type="hidden" name="from" value="">
      ${choices('shape', 'Stone shape', Object.entries(J.SHAPES).map(([k, v]) => [k, v.label, J.shapeIcon(k, 40)]), { step: '01', cls: 'shape-set', checked: def.shape, required: true })}
      <fieldset class="choice-set">
        <legend><span class="step-n">02</span>Center stone size</legend>
        <div class="range-row">
          <label for="carat" class="visually-hidden">Carat weight</label>
          <input type="range" id="carat" name="carat" min="0.5" max="4" step="0.1" value="${def.carat}" aria-describedby="carat-mm">
          <output id="carat-out" for="carat" class="range-out">${def.carat.toFixed(1)} ct</output>
        </div>
        <p class="hint" id="carat-mm">&nbsp;</p>
      </fieldset>
      ${choices('origin', 'Diamond origin', [['natural', 'Natural'], ['lab', 'Lab-grown'], ['undecided', 'Help me decide']], { step: '03', checked: def.origin, hint: `Both are real diamonds. <a class="link" href="${R}education.html#lab-natural">How they differ</a>.` })}
      ${choices('metal', 'Metal', Object.entries(J.METALS).map(([k, v]) => [k, v.label, metalSwatch(k)]), { step: '04', checked: def.metal, required: true })}
      ${choices('style', 'Setting style', Object.entries(J.STYLES).map(([k, v]) => [k, v.label]), { step: '05', checked: def.style, required: true })}
      ${choices('budget', 'Total budget', Object.entries(BUDGETS).concat([['unsure', 'Not sure yet']]), { step: '06', required: true, hint: 'Including the center stone. It helps us bring the right stones to the table.' })}
      ${choices('timeline', 'When do you need it?', [['rush', 'Within 4 weeks'], ['standard', '6 to 8 weeks'], ['flexible', 'Flexible']], { step: '07', required: true })}
      <fieldset class="choice-set">
        <legend><span class="step-n">08</span>Ring size</legend>
        <div class="field"><label for="b-size">US ring size <span class="optional">optional</span></label><p class="hint" id="b-size-hint">Not sure? Borrow a ring they wear on the same finger, or we will mail a free sizer.</p><select id="b-size" name="ringSize" aria-describedby="b-size-hint">${sizes.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></div>
      </fieldset>
      <fieldset class="choice-set">
        <legend><span class="step-n">09</span>Your details</legend>
        <div class="field-grid">
          ${contactFields('b', false)}
          ${field('contactPref', 'Best way to reach you', { type: 'select', idPrefix: 'b', options: [['email', 'Email'], ['phone', 'Phone call'], ['whatsapp', 'WhatsApp']] })}
          ${field('notes', 'Anything else we should know', { type: 'textarea', idPrefix: 'b', wide: true, max: 1200, hint: 'A story, a photo you love, a hand that works with its hands.' })}
        </div>
      </fieldset>
      <div class="form-submit">
        <button class="btn btn-primary" type="submit">Send my design and request a consultation</button>
        <p class="hint">We reply within one business day. Your details are used only to answer this request.</p>
      </div>
    </form>
    <section class="form-success" id="builder-success" data-success-for="builder-form" hidden tabindex="-1" aria-labelledby="builder-success-h">
      <p class="eyebrow">Received</p>
      <h2 class="display-2" id="builder-success-h">Thank you. Your design brief is with Priya.</h2>
      <p>Reference <strong data-ref></strong>. We will be in touch within one business day with first thoughts and stone ideas.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${R}book.html?brief=1">Pick a consultation time now</a>
        <a class="btn btn-ghost" href="https://wa.me/${c.whatsapp}" data-wa-brief rel="noopener">Send it on WhatsApp too</a>
      </div>
    </section>
  </div>
</section>`;
  };

  const diamondProfile = (variant) => {
    const v = { ideal: { pav: 41, label: 'Well cut' }, shallow: { pav: 26, label: 'Too shallow' }, deep: { pav: 58, label: 'Too deep' } }[variant];
    const top = 40, gird = top + 14, cul = gird + v.pav;
    const ray = variant === 'ideal'
      ? `<path d="M92 14 L100 ${gird + v.pav * 0.55} L120 ${gird + v.pav * 0.55} L128 14" fill="none" stroke="var(--champagne-deep)" stroke-width="1.2" marker-end="url(#arr-${variant})"/>`
      : variant === 'shallow'
        ? `<path d="M92 14 L100 ${gird + v.pav * 0.7} L160 ${cul + 14}" fill="none" stroke="var(--champagne-deep)" stroke-width="1.2" marker-end="url(#arr-${variant})"/>`
        : `<path d="M92 14 L100 ${gird + v.pav * 0.62} L132 ${gird + v.pav * 0.5} L196 ${gird + 26}" fill="none" stroke="var(--champagne-deep)" stroke-width="1.2" marker-end="url(#arr-${variant})"/>`;
    return `<figure class="profile"><svg viewBox="0 0 220 ${cul + 22}" role="img" aria-label="${v.label} diamond profile showing the light path" xmlns="http://www.w3.org/2000/svg"><defs><marker id="arr-${variant}" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L8 4L0 8z" fill="var(--champagne-deep)"/></marker></defs>
<polygon points="70,${top} 150,${top} 190,${gird} 110,${cul} 30,${gird}" fill="var(--paper)" stroke="var(--graphite)" stroke-width="1"/>
<line x1="30" y1="${gird}" x2="190" y2="${gird}" stroke="var(--graphite)" stroke-width="0.8"/>${ray}</svg><figcaption>${v.label}</figcaption></figure>`;
  };

  const education = (R) => {
    const shapeNotes = { round: 'The most light return of any shape. Classic and forgiving.', oval: 'Elongates the finger and looks larger than a round of the same weight.', cushion: 'Soft corners and a romantic, slightly antique glow.', emerald: 'Long step-cut facets like a hall of mirrors. Shows clarity, so choose VS or better.', asscher: 'A square step cut with an art deco feel.', princess: 'Crisp square brilliant. Protect the corners with V prongs.', radiant: 'Step-cut outline with brilliant sparkle. Durable cropped corners.', pear: 'Part round, part marquise. Look for symmetry and a good shoulder.', marquise: 'The longest look for its weight. Set the points with V prongs.' };
    const colorFill = ['#ffffff', '#fbf8ee', '#f8f3e2', '#f5eed6', '#f2e8c9', '#efe2bc', '#ecdcad', '#e8d59f', '#e4cd8f', '#dfc47f'];
    const dots = [0, 0, 1, 1, 2, 2, 3, 5, 7, 10];
    return `${pageHead('Diamond education', 'Know what you are looking at.', 'The short version of what a good jeweler explains across the table. Read it before your consultation, or ask us to walk through it with real stones.', `<nav class="toc" aria-label="On this page"><ul><li><a href="#four-cs">The 4Cs</a></li><li><a href="#shapes">Shapes</a></li><li><a href="#anatomy">Anatomy and cut</a></li><li><a href="#lab-natural">Lab-grown and natural</a></li><li><a href="#certification">Certification</a></li><li><a href="#sourcing">Responsible sourcing</a></li></ul></nav>`)}

<section class="section" id="four-cs" aria-labelledby="four-cs-h">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Interactive</p>
      <h2 class="display-2" id="four-cs-h">The 4Cs explorer</h2>
      <p class="section-lede">Move each slider to see how cut, color, clarity and carat change a round diamond. The illustration exaggerates small differences so you can see them on a screen.</p>
    </div>
    <div class="explorer">
      <div class="explorer-stage">
        <div id="explorer-svg">${J.diamond4c({ cut: 4, color: 3, clarity: 5, carat: 1 })}</div>
        <p class="explorer-sum" id="explorer-sum" aria-live="polite">1.00 ct · Excellent cut · G color · VS2 clarity</p>
      </div>
      <form class="explorer-controls" id="explorer" aria-label="4Cs explorer controls">
        <div class="ctl"><div class="ctl-head"><label for="x-cut">Cut</label><output id="x-cut-out" for="x-cut">Excellent</output></div><input type="range" id="x-cut" name="cut" min="0" max="4" step="1" value="4" aria-describedby="x-cut-note"><p class="ctl-note" id="x-cut-note">Cut decides sparkle more than anything else. Stay at Excellent or Very good.</p></div>
        <div class="ctl"><div class="ctl-head"><label for="x-color">Color</label><output id="x-color-out" for="x-color">G</output></div><input type="range" id="x-color" name="color" min="0" max="9" step="1" value="3" aria-describedby="x-color-note"><p class="ctl-note" id="x-color-note">Near colorless. Looks white face-up and is the best value for most clients.</p></div>
        <div class="ctl"><div class="ctl-head"><label for="x-clarity">Clarity</label><output id="x-clarity-out" for="x-clarity">VS2</output></div><input type="range" id="x-clarity" name="clarity" min="0" max="9" step="1" value="5" aria-describedby="x-clarity-note"><p class="ctl-note" id="x-clarity-note">Very slightly included. Eye clean in almost every stone.</p></div>
        <div class="ctl"><div class="ctl-head"><label for="x-carat">Carat</label><output id="x-carat-out" for="x-carat">1.00 ct</output></div><input type="range" id="x-carat" name="carat" min="0.3" max="3" step="0.05" value="1" aria-describedby="x-carat-note"><p class="ctl-note" id="x-carat-note">About 6.4 mm across. Price rises faster than size.</p></div>
      </form>
    </div>
    <div class="scales">
      <figure class="scale">
        <figcaption><h3>Color, D to M</h3><p>D is colorless. Each step adds a faint warmth. Most clients choose G or H.</p></figcaption>
        <svg viewBox="0 0 500 70" role="img" aria-label="Color scale from D, colorless, to M, faint yellow" xmlns="http://www.w3.org/2000/svg">${J.COLOR_GRADES.map((g, i) => `<circle cx="${25 + i * 50}" cy="26" r="17" fill="${colorFill[i]}" stroke="var(--line)"/><text x="${25 + i * 50}" y="62" text-anchor="middle" font-family="Geist, system-ui, sans-serif" font-size="12" fill="var(--graphite)">${g}</text>`).join('')}</svg>
      </figure>
      <figure class="scale">
        <figcaption><h3>Clarity, FL to I2</h3><p>Inclusions are natural birthmarks. VS2 and SI1 are usually eye clean.</p></figcaption>
        <svg viewBox="0 0 500 70" role="img" aria-label="Clarity scale from flawless to included" xmlns="http://www.w3.org/2000/svg">${J.CLARITY_GRADES.map((g, i) => `<rect x="${4 + i * 49.5}" y="12" width="45" height="28" fill="var(--paper)" stroke="var(--line)"/>${Array.from({ length: dots[i] }, (_, k) => `<circle cx="${12 + i * 49.5 + (k * 7.3) % 30}" cy="${20 + (k * 5) % 14}" r="${i > 7 ? 1.6 : 1}" fill="var(--graphite)" fill-opacity="${(0.25 + i * 0.07).toFixed(2)}"/>`).join('')}<text x="${26 + i * 49.5}" y="62" text-anchor="middle" font-family="Geist, system-ui, sans-serif" font-size="11" fill="var(--graphite)">${g}</text>`).join('')}</svg>
      </figure>
      <figure class="scale">
        <figcaption><h3>Carat, to scale</h3><p>Face-up diameter of a well cut round. Twice the weight is not twice the size.</p></figcaption>
        <svg viewBox="0 0 500 110" role="img" aria-label="Round diamonds from 0.5 to 3 carats shown to relative scale" xmlns="http://www.w3.org/2000/svg">${[[0.5, 5.1], [1, 6.4], [1.5, 7.4], [2, 8.1], [3, 9.3]].map(([ct, mm], i) => `<circle cx="${50 + i * 100}" cy="44" r="${(mm * 4).toFixed(1)}" fill="var(--paper)" stroke="var(--graphite)" stroke-width="0.8"/><text x="${50 + i * 100}" y="102" text-anchor="middle" font-family="Geist, system-ui, sans-serif" font-size="12" fill="var(--graphite)">${ct} ct · ${mm} mm</text>`).join('')}</svg>
      </figure>
    </div>
  </div>
</section>

<section class="section section-tint" id="shapes" aria-labelledby="shapes-h">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Shapes</p><h2 class="display-2" id="shapes-h">Nine shapes we source and set most.</h2></div>
    <ul class="shape-grid">
      ${Object.entries(J.SHAPES).map(([k, v]) => `<li class="shape-card reveal"><div class="shape-media">${J.render({ category: 'loose', shape: k, carat: 1, stone: 'diamond', className: 'jewel' }, 'sh' + k)}</div><h3>${esc(v.label)}</h3><p class="small">${esc(shapeNotes[k])}</p><p class="small muted">Typical length to width ${v.ratio.toFixed(2)}</p></li>`).join('')}
    </ul>
  </div>
</section>

<section class="section" id="anatomy" aria-labelledby="anatomy-h">
  <div class="wrap two-col">
    <div>
      <p class="eyebrow">Anatomy and cut</p>
      <h2 class="display-2" id="anatomy-h">Cut is about where the light goes.</h2>
      <p>A well cut diamond takes light in through the table and sends it back out to your eye. Too shallow and light leaks out of the bottom. Too deep and it escapes through the sides. Both look darker and smaller than they should.</p>
      <p>Grading reports give a cut grade for round brilliants only. For fancy shapes we judge proportions by eye and by the numbers, and we show you both.</p>
    </div>
    <div>
      <figure class="anatomy">
        <svg viewBox="0 0 560 290" role="img" aria-labelledby="anat-t" xmlns="http://www.w3.org/2000/svg"><title id="anat-t">Parts of a diamond in profile: table, crown, girdle, pavilion and culet</title>
          <polygon points="170,70 350,70 440,118 260,250 80,118" fill="var(--paper)" stroke="var(--graphite)" stroke-width="1.2"/>
          <line x1="80" y1="118" x2="440" y2="118" stroke="var(--graphite)" stroke-width="1"/>
          <line x1="80" y1="124" x2="440" y2="124" stroke="var(--graphite)" stroke-width="0.6"/>
          <g fill="none" stroke="var(--line)" stroke-width="0.8"><line x1="170" y1="70" x2="200" y2="118"/><line x1="350" y1="70" x2="320" y2="118"/><line x1="200" y1="124" x2="260" y2="250"/><line x1="320" y1="124" x2="260" y2="250"/></g>
          <g font-family="Geist, system-ui, sans-serif" font-size="14" fill="var(--ink)">
            <line x1="260" y1="70" x2="260" y2="40" stroke="var(--champagne-deep)"/><text x="260" y="30" text-anchor="middle">Table</text>
            <line x1="395" y1="94" x2="462" y2="70" stroke="var(--champagne-deep)"/><text x="468" y="74">Crown</text>
            <line x1="440" y1="121" x2="462" y2="121" stroke="var(--champagne-deep)"/><text x="468" y="126">Girdle</text>
            <line x1="360" y1="180" x2="440" y2="200" stroke="var(--champagne-deep)"/><text x="446" y="205">Pavilion</text>
            <line x1="260" y1="250" x2="260" y2="270" stroke="var(--champagne-deep)"/><text x="260" y="286" text-anchor="middle">Culet</text>
          </g>
        </svg>
      </figure>
      <div class="profiles">${['shallow', 'ideal', 'deep'].map(diamondProfile).join('')}</div>
    </div>
  </div>
</section>

<section class="section section-tint" id="lab-natural" aria-labelledby="lab-h">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Origin</p><h2 class="display-2" id="lab-h">Lab-grown and natural, honestly compared.</h2><p class="section-lede">Both are real diamonds with the same chemistry and hardness. The difference is origin, price and how they hold value. We sell both and have no preference for which you choose.</p></div>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Comparison table, scrolls sideways on small screens">
      <table class="compare">
        <caption class="visually-hidden">Lab-grown versus natural diamonds</caption>
        <thead><tr><th scope="col"><span class="visually-hidden">Attribute</span></th><th scope="col">Natural</th><th scope="col">Lab-grown</th></tr></thead>
        <tbody>
          <tr><th scope="row">What it is</th><td>Carbon crystallized in the earth over billions of years</td><td>The same carbon crystal, grown in weeks by CVD or HPHT</td></tr>
          <tr><th scope="row">Looks and hardness</th><td>Identical to the eye. 10 on the Mohs scale</td><td>Identical to the eye. 10 on the Mohs scale</td></tr>
          <tr><th scope="row">Price for the same grades</th><td>Higher</td><td>Typically a fraction of a comparable natural stone, and still falling</td></tr>
          <tr><th scope="row">Resale value</th><td>Some secondary market, below retail</td><td>Very limited secondary market today</td></tr>
          <tr><th scope="row">Grading</th><td>GIA or IGI report</td><td>GIA or IGI report, marked laboratory-grown, usually laser inscribed</td></tr>
          <tr><th scope="row">Choose it if</th><td>Rarity and long-term value matter to you</td><td>You want more size or a higher grade for the budget</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section" id="certification" aria-labelledby="cert-h">
  <div class="wrap two-col">
    <div>
      <p class="eyebrow">Certification</p>
      <h2 class="display-2" id="cert-h">A grading report is the stone's passport.</h2>
      <p>Every center diamond we sell above 0.30 carats comes with a report from an independent laboratory. We do not grade our own center stones for sale.</p>
      <dl class="cert-list">
        <div><dt>GIA</dt><dd>Gemological Institute of America. The nonprofit that created the 4Cs grading system. Our first choice for natural diamonds.</dd></div>
        <div><dt>IGI</dt><dd>International Gemological Institute. The most common laboratory for lab-grown diamonds, with clear and consistent reports.</dd></div>
      </dl>
      <p>Each report has a unique number, usually laser inscribed on the girdle. You can look it up on the laboratory's own website, and we show you the inscription under magnification before you buy.</p>
    </div>
    <figure class="report">
      <svg viewBox="0 0 420 300" role="img" aria-labelledby="rep-t" xmlns="http://www.w3.org/2000/svg"><title id="rep-t">Sample grading report layout, illustrative only</title>
        <rect x="1" y="1" width="418" height="298" fill="var(--paper)" stroke="var(--line)"/>
        <text x="24" y="38" font-family="Newsreader, Georgia, serif" font-size="18" fill="var(--ink)">Diamond Grading Report</text>
        <text x="396" y="38" text-anchor="end" font-family="Geist, system-ui, sans-serif" font-size="10" letter-spacing="1.5" fill="var(--champagne-deep)">SAMPLE</text>
        <line x1="24" y1="52" x2="396" y2="52" stroke="var(--line)"/>
        <g font-family="Geist, system-ui, sans-serif" font-size="11" fill="var(--graphite)">
          ${[['Report number', 'XXXX-XXXX-XX'], ['Shape and cut', 'Round brilliant'], ['Measurements', '6.42 x 6.45 x 3.97 mm'], ['Carat weight', '1.01'], ['Color grade', 'G'], ['Clarity grade', 'VS2'], ['Cut grade', 'Excellent'], ['Fluorescence', 'None']].map(([k, v], i) => `<text x="24" y="${78 + i * 24}">${k}</text><text x="190" y="${78 + i * 24}" fill="var(--ink)">${v}</text>`).join('')}
        </g>
        <g transform="translate(340 220)"><circle r="34" fill="none" stroke="var(--line)"/><polygon points="0,-24 17,-17 24,0 17,17 0,24 -17,17 -24,0 -17,-17" fill="none" stroke="var(--line)"/></g>
      </svg>
      <figcaption>Illustrative layout only. Not a real report and not affiliated with any laboratory.</figcaption>
    </figure>
  </div>
</section>

<section class="section section-tint" id="sourcing" aria-labelledby="src-h">
  <div class="wrap two-col">
    <div>
      <p class="eyebrow">Responsible sourcing</p>
      <h2 class="display-2" id="src-h">What conflict-free means, and what it does not.</h2>
    </div>
    <div class="prose">
      <p>We buy diamonds only from suppliers who comply with the <strong>Kimberley Process</strong>, the international scheme that blocks rough diamonds that fund rebel movements, and who pass a written warranty to us under the <strong>World Diamond Council System of Warranties</strong>.</p>
      <p>The Kimberley Process defines conflict narrowly, so we go further where we can. We ask for country of origin, offer stones with traceable origin on request, and offer recycled platinum and gold for every design.</p>
      <p>Lab-grown diamonds avoid mining altogether. Their footprint depends on the energy used to grow them, and we share what our growers disclose.</p>
    </div>
  </div>
</section>
${bookBand(R, 'See the difference in person, not on a screen.')}`;
  };

  const gantt = () => {
    const total = Math.max(...allSteps.map((s) => s.weeks[1])), x0 = 118, wpx = 260, row = 34;
    const xs = (w) => x0 + (w / total) * wpx;
    const ticks = Array.from({ length: total + 1 }, (_, w) => `<line x1="${xs(w)}" y1="18" x2="${xs(w)}" y2="${24 + allSteps.length * row}" stroke="var(--line)"/><text x="${xs(w)}" y="12" text-anchor="middle">${w}</text>`).join('');
    const bars = allSteps.map((s, i) => `<text x="0" y="${44 + i * row}">${esc(s.title.split(' ')[0])}</text><rect x="${xs(s.weeks[0])}" y="${32 + i * row}" width="${Math.max(6, xs(s.weeks[1]) - xs(s.weeks[0]))}" height="16" rx="1" fill="${i === allSteps.length - 1 ? 'var(--champagne-deep)' : 'var(--ink)'}"/>`).join('');
    return `<svg class="gantt" viewBox="0 0 ${x0 + wpx + 8} ${40 + allSteps.length * row}" role="img" aria-label="Timeline in weeks: ${allSteps.map((s) => `${s.title}, week ${s.weeks[0]} to ${s.weeks[1]}`).join('; ')}" xmlns="http://www.w3.org/2000/svg"><g font-family="Geist, system-ui, sans-serif" font-size="12" fill="var(--graphite)">${ticks}${bars}</g></svg><p class="small muted">Weeks from your consultation.</p>`;
  };

  const processPage = (R) => `${pageHead('The process', 'From first sketch to your hand in six weeks.', 'Every commission follows the same path. You approve each stage before the next begins, and you always know who is working on your piece.')}
<section class="section-sm">
  <div class="wrap process-grid">
    <ol class="timeline">
      ${allSteps.map((s, i) => `<li class="tl-item reveal"><div class="tl-marker"><span>${String(i + 1).padStart(2, '0')}</span></div><div class="tl-body"><p class="eyebrow">${esc(s.phase)} · ${esc(s.when)}</p><h2 class="display-3">${esc(s.title)}</h2><p>${esc(s.detail)}</p></div></li>`).join('')}
    </ol>
    <aside class="gantt-card" aria-labelledby="gantt-h">
      <h2 class="display-3" id="gantt-h">A typical six weeks</h2>
      ${gantt()}
      <p class="small muted">Rush timelines of three to four weeks are possible, depending on the bench schedule.</p>
    </aside>
  </div>
</section>
<section class="section section-tint">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">Payments</p><h2 class="display-2">Three payments, each tied to something you approve.</h2></div>
    <ol class="pay-grid">
      <li class="pay reveal"><p class="pay-k">At booking</p><p class="pay-v">${money(cons.retainer)}</p><p>Design retainer, credited in full. Refunded if we cannot make what you want.</p></li>
      <li class="pay reveal"><p class="pay-k">At CAD approval</p><p class="pay-v">50%</p><p>Deposit once you approve the 3D model and your stone. Production starts here.</p></li>
      <li class="pay reveal"><p class="pay-k">At delivery</p><p class="pay-v">Balance</p><p>Paid when you have seen the finished piece. Card, wire or Zelle.</p></li>
    </ol>
  </div>
</section>
<section class="section">
  <div class="wrap two-col">
    <div><p class="eyebrow">Good to know</p><h2 class="display-2">Timing, changes and rush orders.</h2></div>
    <div class="prose">
      <p><strong>Changes</strong> are free until you approve the CAD model. Two rounds of CAD revisions are included.</p>
      <p><strong>Rush timelines</strong> of three to four weeks are possible depending on the bench schedule. Ask at the consultation.</p>
      <p><strong>Proposal secrecy</strong> is part of the job. We can send every update to one person only, and we hold finished rings in our safe until the day.</p>
      <p><strong>What you receive</strong> at delivery: the grading report, a written appraisal for insurance, a care guide and free cleaning and prong checks for life.</p>
    </div>
  </div>
</section>
${bookBand(R)}`;

  const book = (R) => `${pageHead('Book a consultation', 'Reserve an hour at the atelier.', `${esc(cons.durationMinutes)} minutes in person on West 47th Street or ${esc(cons.virtualDurationMinutes)} minutes on video. You meet the designer and the bench jeweler who will make your piece.`)}
<section class="section-sm">
  <div class="wrap booking">
    <form class="booking-form" id="booking-form" data-form="booking" novalidate>
      ${errorSummary}
      ${choices('type', 'What are we designing?', cons.types.map((t) => [t.id, t.label]), { step: '01', required: true, checked: cons.types[0].id })}
      ${choices('mode', 'Where would you like to meet?', [['in-person', 'At the atelier'], ['virtual', 'Video call']], { step: '02', required: true, checked: 'in-person' })}
      <fieldset class="choice-set" aria-describedby="err-date">
        <legend><span class="step-n">03</span>Choose a day</legend>
        <div class="calendar" id="calendar">
          <div class="field"><label for="date-fallback">Preferred date</label><input id="date-fallback" type="date" name="date" required></div>
        </div>
        <p class="field-error" id="err-date" data-error-for="date"></p>
      </fieldset>
      <fieldset class="choice-set" aria-describedby="err-time">
        <legend><span class="step-n">04</span>Choose a time</legend>
        <p class="hint" id="slot-hint">Pick a day to see open times. All times are New York time.</p>
        <div class="slots choices" id="slots">${cons.slotTimes.map((t, i) => `<label class="choice"><input type="radio" name="time" value="${t}"${i === 0 ? ' required' : ''}><span class="choice-face"><span class="choice-label">${time12(t)}</span></span></label>`).join('')}</div>
        <p class="field-error" id="err-time" data-error-for="time"></p>
      </fieldset>
      <fieldset class="choice-set">
        <legend><span class="step-n">05</span>Your details</legend>
        <div class="field-grid">
          ${contactFields('k', true)}
          ${field('partner', 'Is this a surprise?', { type: 'select', idPrefix: 'k', options: [['', 'Choose one'], ['surprise', 'Yes, keep it between us'], ['together', 'No, we are coming together'], ['self', 'It is for me']] })}
          ${field('notes', 'Notes for the designer', { type: 'textarea', idPrefix: 'k', wide: true, max: 1200 })}
        </div>
        <div class="attachments" id="attachments" hidden>
          <p class="hint">We will bring these to your consultation:</p>
          <ul id="attachment-list"></ul>
        </div>
      </fieldset>
      <fieldset class="choice-set retainer">
        <legend><span class="step-n">06</span>Design retainer</legend>
        <p>${esc(cons.retainerCopy)}</p>
        <p class="small">${esc(cons.refundCopy)} After you book, we send a secure payment link to confirm your time.</p>
        <label class="check"><input type="checkbox" name="retainerAck" value="yes" required aria-describedby="err-retainerAck"><span>I understand the ${money(cons.retainer)} retainer is credited to my commission.</span></label>
        <p class="field-error" id="err-retainerAck" data-error-for="retainerAck"></p>
      </fieldset>
      <div class="form-submit">
        <button class="btn btn-primary" type="submit">Request this time</button>
        <p class="hint">You can reschedule free up to 24 hours ahead.</p>
      </div>
    </form>
    <aside class="booking-aside" aria-label="What to expect">
      <div class="aside-card">
        <h2 class="display-3">What happens in the hour</h2>
        <ol class="aside-list">
          <li>We talk about the person, the hand and the date you are working toward.</li>
          <li>You try on settings in every shape and metal.</li>
          <li>We look at real stones together under daylight and our lamp.</li>
          <li>You leave with a written brief and a budget split.</li>
        </ol>
        <p class="small">Prefer to talk first? <a class="link" href="tel:${c.phoneHref}">${esc(c.phone)}</a> or <a class="link" href="https://wa.me/${c.whatsapp}" rel="noopener">WhatsApp</a>.</p>
      </div>
    </aside>
    <section class="form-success booking-success" id="booking-success" data-success-for="booking-form" hidden tabindex="-1" aria-labelledby="bk-h">
      <p class="eyebrow">Requested</p>
      <h2 class="display-2" id="bk-h">Your consultation is requested.</h2>
      <p>Reference <strong data-ref></strong>. We have held this time for you and will send the retainer link and confirmation to <strong data-field="email"></strong> within a few business hours.</p>
      <dl class="spec-list" id="booking-summary"></dl>
      <div class="cta-row">
        <button class="btn btn-primary" type="button" id="ics-download">Add to calendar</button>
        <a class="btn btn-ghost" href="${R}contact.html">Directions to the atelier</a>
      </div>
    </section>
  </div>
</section>`;

  const services = (R) => `${pageHead('Services', 'Care, resizing, appraisals and repair.', 'For pieces we made and pieces we did not. Prices are listed so you know what to expect before you walk in.')}
<section class="section-sm">
  <div class="wrap">
    <div class="service-list">
      ${content.services.map((s) => `<article class="service reveal" id="${s.id}"><h2 class="display-3">${esc(s.title)}</h2><p>${esc(s.detail)}</p><dl class="service-meta"><div><dt>Price</dt><dd>${esc(s.price)}</dd></div><div><dt>Turnaround</dt><dd>${esc(s.turnaround)}</dd></div></dl></article>`).join('')}
    </div>
    ${config.demo ? '<p class="demo-label">Demo pricing. Replace with your own rates in content/services.json.</p>' : ''}
  </div>
</section>
<section class="section section-tint" id="insurance">
  <div class="wrap two-col">
    <div><p class="eyebrow">Insurance</p><h2 class="display-2">Insure it the week you get it.</h2></div>
    <div class="prose">
      <p>Most homeowners and renters policies cap jewelry cover at a low amount. Ask your insurer for a scheduled rider, or use a specialist jewelry insurer. Either one will ask for an appraisal.</p>
      <p>We include a written appraisal with every commission. For other pieces, our appraisals list measurements, photographs and stone grades. Update them every three to five years as metal and stone prices move.</p>
    </div>
  </div>
</section>
<section class="section" id="inquiry">
  <div class="wrap narrow">
    <div class="section-head"><p class="eyebrow">Appraisal and repair inquiry</p><h2 class="display-2">Tell us about the piece.</h2><p class="section-lede">Photos help us quote faster. We reply within one business day with a price and a time to drop it off.</p></div>
    <form class="stack-form" id="service-form" data-form="service" novalidate>
      ${errorSummary}
      <div class="field-grid">
        ${field('service', 'Service', { type: 'select', required: true, idPrefix: 's', options: [['', 'Choose a service']].concat(content.services.map((s) => [s.id, s.title])) })}
        ${field('item', 'Type of piece', { type: 'select', required: true, idPrefix: 's', options: [['', 'Choose one'], ['engagement', 'Engagement ring'], ['band', 'Wedding band'], ['earrings', 'Earrings'], ['pendant', 'Necklace or pendant'], ['bracelet', 'Bracelet'], ['watch', 'Watch'], ['other', 'Something else']] })}
        ${field('madeHere', `Made by ${b.name}?`, { type: 'select', idPrefix: 's', options: [['no', 'No'], ['yes', 'Yes'], ['unsure', 'Not sure']] })}
        ${field('dropoff', 'How will you get it to us?', { type: 'select', idPrefix: 's', options: [['visit', 'Drop off at the atelier'], ['mail', 'Insured mail-in'], ['undecided', 'Not sure yet']] })}
        ${field('description', 'What does it need?', { type: 'textarea', required: true, idPrefix: 's', wide: true, max: 1500, hint: 'Metal, stones, size, and what you have noticed. A loose prong, a thin band, a size change.' })}
        <div class="field field-wide"><label for="s-photos">Photos <span class="optional">optional, up to 5</span></label><p class="hint" id="s-photos-hint">JPG, PNG or HEIC. Front, side and inside of the band help most.</p><input id="s-photos" name="photos" type="file" accept="image/*" multiple aria-describedby="s-photos-hint s-photos-err"><p class="field-error" id="s-photos-err" data-error-for="photos"></p><ul class="file-list" id="file-list"></ul></div>
        ${contactFields('s', false)}
      </div>
      <div class="form-submit"><button class="btn btn-primary" type="submit">Send inquiry</button></div>
    </form>
    <section class="form-success" id="service-success" data-success-for="service-form" hidden tabindex="-1" aria-labelledby="sv-h">
      <p class="eyebrow">Received</p><h2 class="display-2" id="sv-h">Thank you. Elias will look at this today.</h2>
      <p>Reference <strong data-ref></strong>. Expect a written quote by email within one business day.</p>
    </section>
  </div>
</section>`;

  const about = (R) => `${pageHead('About', `${esc(b.name)} is five people and six benches.`, `Founded in ${b.founded} by Ilana Roth in a single room on West 47th Street. Today the atelier designs and makes about two hundred pieces a year, each for one person, with no showroom stock and no commission sales staff.`)}
<section class="section-sm">
  <div class="wrap">
    <ul class="team-grid">
      ${config.team.map((m, i) => `<li class="member reveal">${teamPortrait(m, i)}<h2 class="display-3">${esc(m.name)}</h2><p class="member-role">${esc(m.role)}</p><p class="small muted">${esc(m.credential)} · ${m.years} years</p><p>${esc(m.bio)}</p></li>`).join('')}
    </ul>
    ${config.demo ? '<p class="demo-label">Fictional team for the demo. Replace portraits with real photographs of your makers.</p>' : ''}
  </div>
</section>
<section class="section section-tint">
  <div class="wrap two-col">
    <div><p class="eyebrow">How we work</p><h2 class="display-2">Three promises we keep.</h2></div>
    <div class="prose">
      <p><strong>You meet the maker.</strong> The person who sets your stone is in the room at your consultation.</p>
      <p><strong>Prices in writing.</strong> You get an itemized quote for the stone, the setting and the labor before you pay a deposit.</p>
      <p><strong>No pressure, ever.</strong> We will never run a countdown on you. Take the brief home and decide when you are ready.</p>
    </div>
  </div>
</section>
${bookBand(R)}`;

  const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');
  const faq = (R) => `${pageHead('Questions', 'Frequently asked questions.', `If yours is not here, <a class="link" href="${R}contact.html">ask us directly</a>. A person answers every message.`)}
<section class="section-sm">
  <div class="wrap narrow">
    ${content.faq.map((g) => `<section class="faq-group" aria-labelledby="faq-${slug(g.group)}"><h2 class="display-3" id="faq-${slug(g.group)}">${esc(g.group)}</h2>${g.items.map((it) => `<details class="faq"><summary>${esc(it.q)}</summary><div class="faq-a"><p>${esc(it.a)}</p></div></details>`).join('')}</section>`).join('')}
  </div>
</section>
${bookBand(R)}`;

  const contact = (R) => `${pageHead('Contact and visit', 'Find us on West 47th Street.', 'We are upstairs, not on the street. Here is exactly how to get to us.')}
<section class="section-sm">
  <div class="wrap visit">
    <div>
      <h2 class="display-3">Address</h2>
      <address class="visit-address">${esc(c.address.street)}<br>${esc(c.address.locality)}, ${esc(c.address.region)} ${esc(c.address.postalCode)}</address>
      <p><strong>Getting in.</strong> ${esc(c.entryNote)}</p>
      <p><strong>Transit.</strong> ${esc(c.transit)}</p>
      <h2 class="display-3">Hours</h2>
      ${hoursTable()}
      <ul class="contact-links">
        <li><a class="link" href="tel:${c.phoneHref}">${esc(c.phone)}</a></li>
        <li><a class="link" href="mailto:${c.email}">${esc(c.email)}</a></li>
        <li><a class="link" href="https://wa.me/${c.whatsapp}" rel="noopener">WhatsApp</a></li>
      </ul>
    </div>
    ${map()}
  </div>
</section>
<section class="section section-tint">
  <div class="wrap narrow">
    <div class="section-head"><p class="eyebrow">Write to us</p><h2 class="display-2">Send a message.</h2></div>
    <form class="stack-form" id="contact-form" data-form="contact" novalidate>
      ${errorSummary}
      <div class="field-grid">
        ${contactFields('m', false)}
        ${field('topic', 'Topic', { type: 'select', idPrefix: 'm', options: [['general', 'General question'], ['commission', 'A new commission'], ['existing', 'A piece in progress'], ['press', 'Press or partnerships']] })}
        ${field('message', 'Message', { type: 'textarea', required: true, idPrefix: 'm', wide: true, max: 2000 })}
      </div>
      <div class="form-submit"><button class="btn btn-primary" type="submit">Send message</button></div>
    </form>
    <section class="form-success" id="contact-success" data-success-for="contact-form" hidden tabindex="-1" aria-labelledby="ct-h">
      <p class="eyebrow">Sent</p><h2 class="display-2" id="ct-h">Thank you. We will reply within one business day.</h2><p>Reference <strong data-ref></strong>.</p>
    </section>
  </div>
</section>`;

  const legal = () => `${pageHead('Legal', 'Privacy, terms and accessibility.', '')}
<section class="section-sm">
  <div class="wrap narrow prose legal">
    ${config.demo ? `<h2 id="demo">Demo disclosure</h2><p>This website is a design template. ${esc(b.name)}, its address, phone numbers, team, commissions, prices, reviews and credentials are fictional placeholders. Jewelry images are computer illustrations, not photographs of real pieces. Grading report numbers are intentionally withheld and the sample report is not a real document.</p>` : ''}
    <h2 id="privacy">Privacy</h2>
    <p>We collect only what you send us through our forms: your name, contact details and what you tell us about the piece you want. We use it to answer you and to make your commission. We do not sell it or share it for advertising.</p>
    <p>This site uses no cookies and no third-party trackers. Your saved pieces and a copy of your design brief are kept in your own browser's local storage so they are there when you come back. Clear your browser data to remove them.</p>
    <p>To see or delete what we hold about you, email <a href="mailto:${c.email}">${esc(c.email)}</a>.</p>
    <h2 id="terms">Terms</h2>
    <p>Illustrative price ranges on this site are estimates, not offers. Your price is confirmed in a written quote after your consultation. Custom pieces are made to order and are not returnable once casting begins, except for manufacturing defects, which our lifetime warranty covers.</p>
    <p>The design retainer is credited in full toward your commission. It is refundable if you cancel more than 48 hours before your consultation or if we cannot make the piece you want.</p>
    <h2 id="accessibility">Accessibility</h2>
    <p>We aim to meet WCAG 2.2 level AA. The site works with a keyboard and screen readers, respects your reduced motion setting and uses no popups or timers. If anything gets in your way, call <a href="tel:${c.phoneHref}">${esc(c.phone)}</a> and we will help directly.</p>
  </div>
</section>`;

  const saved = (R) => `${pageHead('Saved', 'Your saved pieces.', 'Saved on this device only. Bring them to your consultation and we will start from there.')}
<section class="section-sm">
  <div class="wrap">
    <div class="piece-grid" id="saved-grid"></div>
    <div class="empty-state" id="saved-empty" hidden>
      <p class="display-3">Nothing saved yet.</p>
      <p>Tap the heart on any commission to keep it here.</p>
      <p><a class="btn btn-primary" href="${R}collections.html">Browse commissions</a></p>
    </div>
    <div class="cta-row saved-actions" id="saved-actions" hidden>
      <a class="btn btn-primary" href="${R}book.html">Bring these to a consultation</a>
      <button class="btn btn-ghost" type="button" id="saved-clear">Clear saved</button>
    </div>
  </div>
</section>`;

  const notFound = (R) => `<section class="page-head center"><div class="wrap narrow"><p class="eyebrow">404</p><h1 class="display">This page is not here.</h1><p class="lede">It may have moved. Everything else is where you left it.</p><div class="cta-row center"><a class="btn btn-primary" href="${R}index.html">Home</a><a class="btn btn-ghost" href="${R}collections.html">Commissions</a></div></div></section>`;

  const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: content.faq.flatMap((g) => g.items.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } }))) };

  const list = [
    { key: 'home', path: 'index.html', title: '', body: home },
    { key: 'collections', nav: 'collections', path: 'collections.html', title: 'Commissions', description: `Past custom engagement rings, bands and fine jewelry made by ${b.name} on West 47th Street. Filter by shape, metal, style and budget.`, body: collections, scripts: ['collections.js'] },
    { key: 'design', nav: 'design', path: 'design.html', title: 'Design your ring', description: 'Choose shape, carat, metal and setting with a live preview, then request a consultation.', body: design, scripts: ['builder.js'] },
    { key: 'education', nav: 'education', path: 'education.html', title: 'Diamond education', description: 'The 4Cs, diamond shapes, lab-grown versus natural, GIA and IGI certification and responsible sourcing, explained plainly.', body: education, scripts: ['education.js'] },
    { key: 'process', nav: 'process', path: 'process.html', title: 'The process', description: 'Consultation, sketch, CAD, casting, setting and delivery in about six weeks, with a clear payment schedule.', body: processPage },
    { key: 'book', nav: 'book', path: 'book.html', title: 'Book a consultation', description: `Reserve an hour with a designer and bench jeweler at ${b.name}, in person or on video.`, body: book, scripts: ['booking.js'] },
    { key: 'services', nav: 'services', path: 'services.html', title: 'Care, resizing and appraisals', description: 'Cleaning, resizing, repair, insurance appraisals and heirloom redesign with listed prices.', body: services },
    { key: 'about', nav: 'about', path: 'about.html', title: 'About the atelier', description: `Meet the five people who design and make every ${b.name} piece.`, body: about },
    { key: 'faq', path: 'faq.html', title: 'FAQ', description: 'Retainers, pricing, timing, lab-grown diamonds, warranty and shipping.', body: faq, jsonld: [faqLd] },
    { key: 'contact', path: 'contact.html', title: 'Contact and visit', description: `Address, hours, entry instructions and directions to ${b.name} on West 47th Street.`, body: contact },
    { key: 'legal', path: 'legal.html', title: 'Privacy, terms and accessibility', body: legal },
    { key: 'saved', path: 'saved.html', title: 'Saved pieces', body: saved, noindex: true, scripts: ['saved.js'] },
    { key: 'notfound', path: '404.html', title: 'Page not found', body: notFound, noindex: true, absolute: true }
  ].concat(content.commissions.map((p, i, arr) => ({
    key: 'work', nav: 'collections', path: `work/${p.id}.html`, title: p.title, description: `${p.summary} A custom commission by ${b.name}.`, ogType: 'article', body: workPage(p, i, arr),
    jsonld: [{ '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.title, description: p.summary, dateCreated: String(p.year), creator: { '@id': `${config.site.baseUrl}/#business` } }]
  })));

  const nav = [
    { key: 'process', label: 'Process', href: 'process.html' },
    { key: 'collections', label: 'Commissions', href: 'collections.html' },
    { key: 'design', label: 'Design your ring', href: 'design.html' },
    { key: 'education', label: 'Education', href: 'education.html' },
    { key: 'services', label: 'Services', href: 'services.html' },
    { key: 'about', label: 'About', href: 'about.html' }
  ];
  const footer = nav.concat([{ label: 'Book a consultation', href: 'book.html' }, { label: 'FAQ', href: 'faq.html' }, { label: 'Contact and visit', href: 'contact.html' }, { label: 'Saved pieces', href: 'saved.html' }]);
  return { list, nav, footer };
};
