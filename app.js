/* Page behaviour: icon rendering, mobile nav, and the demo route search.
   Classic script — depends on `cities` and `findRoutes` from search.js,
   which must load first. */

const ICON_PATHS = {
  arrow: '<path d="M5 12h14" /><path d="m12 5 7 7-7 7" />',
  search: '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" />',
  box: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" /><path d="m7.5 4.27 9 5.15" />',
  truck:
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 18.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />',
  check: '<path d="M20 6 9 17l-5-5" />',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />',
  swap: '<path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />',
  menu: '<path d="M4 5h16" /><path d="M4 12h16" /><path d="M4 19h16" />',
  close: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
  people:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
  play: '<path d="M6 3v18l15-9Z" />',
};

function iconSvg(name, { size = 20, stroke = 2, fill = 'none' } = {}) {
  const body = ICON_PATHS[name] || ICON_PATHS.box;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function renderIcon(el) {
  el.innerHTML = iconSvg(el.dataset.icon, {
    size: el.dataset.size ? Number(el.dataset.size) : undefined,
    stroke: el.dataset.stroke ? Number(el.dataset.stroke) : undefined,
    fill: el.dataset.fill || undefined,
  });
}

function hydrateIcons(root) {
  root.querySelectorAll('[data-icon]').forEach(renderIcon);
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]
  );
}

/* --- Mobile navigation --- */

function setupNav() {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('navigation');

  function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute(
      'aria-label',
      open ? 'Close navigation' : 'Open navigation'
    );
    toggle.innerHTML = iconSvg(open ? 'close' : 'menu', { size: 24 });
  }

  toggle.addEventListener('click', () =>
    setOpen(!nav.classList.contains('open'))
  );
  nav.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/* --- Route search --- */

function routeCard(route) {
  return `
    <article class="result-card">
      <div class="result-top">${iconSvg('truck', { size: 20 })}<span>DEMO ROUTE</span></div>
      <h3>${escapeHtml(route.from)} <span>→</span> ${escapeHtml(route.to)}</h3>
      <p>${escapeHtml(route.carrier)}</p>
      <dl>
        <div><dt>Vehicle</dt><dd>${escapeHtml(route.vehicle)}</dd></div>
        <div><dt>Available space</dt><dd>${route.capacity.toLocaleString()} kg</dd></div>
        <div><dt>Schedule</dt><dd>${escapeHtml(route.schedule)}</dd></div>
        <div><dt>Est. transit</dt><dd>${escapeHtml(route.duration)}</dd></div>
      </dl>
      <div class="result-price">
        <span>Starting at <strong>₱${route.price.toLocaleString()}</strong></span>
        <span>per shipment</span>
      </div>
    </article>`;
}

function setupSearch() {
  const form = document.getElementById('search-form');
  const fromSelect = form.querySelector('[data-field="from"]');
  const toSelect = form.querySelector('[data-field="to"]');
  const weightInput = form.querySelector('[data-field="weight"]');
  const errorEl = form.querySelector('.form-error');
  const resultsEl = document.getElementById('results');
  const popular = document.querySelector('.popular');

  for (const city of cities) {
    fromSelect.add(new Option(city, city));
    toSelect.add(new Option(city, city));
  }

  function setError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function render(list) {
    const count = list.length;
    const label = count === 1 ? 'route' : 'routes';
    const body = count
      ? `<div class="result-grid">${list.map(routeCard).join('')}</div>`
      : `<div class="empty-state">
           ${iconSvg('search', { size: 24 })}
           <h3>No shared routes found just yet.</h3>
           <p>Try another destination or a smaller cargo weight. These sample listings cover a limited set of routes.</p>
         </div>`;

    resultsEl.innerHTML = `
      <div class="results-heading">
        <div>
          <h2 id="results-title">${count} matching ${label}</h2>
          <p>Sample listings only. Prices are illustrative starting rates, not live quotes.</p>
        </div>
        <button class="text-link" type="button" data-hide-results>
          Hide results ${iconSvg('close', { size: 16 })}
        </button>
      </div>
      ${body}`;
    resultsEl.hidden = false;
    requestAnimationFrame(() => resultsEl.focus({ preventScroll: false }));
  }

  function runSearch(params) {
    render(findRoutes(params));
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const from = fromSelect.value;
    const to = toSelect.value;
    if (from && from === to) {
      setError('Choose a destination different from your pickup location.');
      return;
    }
    setError('');
    runSearch({ from, to, weight: weightInput.value });
  });

  form.querySelector('.swap-button').addEventListener('click', () => {
    const previousFrom = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previousFrom;
  });

  popular.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-from]');
    if (!button) return;
    fromSelect.value = button.dataset.from;
    toSelect.value = button.dataset.to;
    weightInput.value = '';
    setError('');
    runSearch({ from: button.dataset.from, to: button.dataset.to, weight: '' });
  });

  resultsEl.addEventListener('click', (event) => {
    if (!event.target.closest('[data-hide-results]')) return;
    resultsEl.hidden = true;
    resultsEl.innerHTML = '';
    document
      .getElementById('search-title')
      ?.scrollIntoView({ block: 'center' });
  });
}

/* --- Init --- */

hydrateIcons(document);
setupNav();
setupSearch();

const footerCopy = document.querySelector('[data-footer-copy]');
if (footerCopy) {
  footerCopy.textContent = `© ${new Date().getFullYear()} CargoFlow. A student-built frontend prototype.`;
}
