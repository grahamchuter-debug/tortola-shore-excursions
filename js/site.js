/**
 * Loads shared layout partials. Requires a local server (not file://).
 * Set on <body>: data-base, data-page, data-hero (optional), data-content (optional)
 */
(function () {
  function basePath() {
    const base = document.body.dataset.base;
    if (base === undefined || base === '') return '';
    return base.endsWith('/') ? base : base + '/';
  }

  async function loadInto(id, url) {
    const el = document.getElementById(id);
    if (!el || !url) return;

    try {
      const res = await fetch(basePath() + url);
      if (!res.ok) throw new Error(res.statusText);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error('Layout load failed:', url, err);
      el.innerHTML =
        '<p class="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">Could not load ' +
        url +
        '. Run the site with a local server, e.g. <code class="text-xs">python3 -m http.server</code>.</p>';
    }
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    if (!page) return;

    document.querySelectorAll('[data-nav]').forEach(function (link) {
      const isActive = link.dataset.nav === page;
      link.classList.toggle('text-ocean-600', isActive);
      link.classList.toggle('font-semibold', isActive);
      link.classList.toggle('text-gray-600', !isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
    });
  }

  function wireMobileNav() {
    const nav = document.querySelector('#site-nav nav');
    if (!nav) return;
    const btn = nav.querySelector('button[aria-label="Open menu"], button[aria-label="Close menu"]');
    let panel = nav.querySelector('[data-mobile-panel]');
    if (!btn) return;

    if (!panel) {
      panel = document.createElement('div');
      panel.setAttribute('data-mobile-panel', 'true');
      panel.className = 'lg:hidden hidden border-t border-ocean-100 bg-white px-4 py-3';
      panel.innerHTML =
        '<div class="flex flex-col gap-3 text-sm font-medium">' +
        '<a href="/" class="py-2 text-gray-700 hover:text-ocean-600">Home</a>' +
        '<a href="/tortola-tour-pages" class="py-2 text-gray-700 hover:text-ocean-600">Tour Hub</a>' +
        '<a href="/the-baths-discovery-tortola" class="py-2 text-gray-700 hover:text-ocean-600">The Baths</a>' +
        '<a href="/best-beaches-in-tortola-for-cruise-passengers" class="py-2 text-gray-700 hover:text-ocean-600">Beaches</a>' +
        '<a href="/private-tortola-jeep-tour" class="py-2 text-gray-700 hover:text-ocean-600">Private Jeep</a>' +
        '<a href="/jost-van-dyke-escape" class="py-2 text-gray-700 hover:text-ocean-600">Jost Van Dyke</a>' +
        '<a href="/tortola-catamaran-snorkeling-tours" class="py-2 text-gray-700 hover:text-ocean-600">Snorkelling</a>' +
        '<a href="/ship-schedule/" class="py-2 text-gray-700 hover:text-ocean-600">Ship Schedule</a>' +
        '<a href="/tortola-cruise-port-guide" class="py-2 text-gray-700 hover:text-ocean-600">Port Guide</a>' +
        '<a href="/contact" class="py-2 text-gray-700 hover:text-ocean-600">Contact</a>' +
        '</div>';
      nav.appendChild(panel);
    }

    function setOpen(open) {
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    btn.addEventListener('click', function () {
      const open = panel.classList.contains('hidden');
      setOpen(open);
    });

    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        setOpen(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const hero = document.body.dataset.hero;
    const content = document.body.dataset.content;
    const trustStrip = document.body.dataset.trustStrip;

    await Promise.all([
      loadInto('site-nav', 'partials/nav.html'),
      loadInto('site-footer', 'partials/footer.html'),
      loadInto('page-hero', hero),
      loadInto('page-trust-strip', trustStrip),
      loadInto('page-content', content),
    ]);

    setActiveNav();
    wireMobileNav();
  });
})();
