/**
 * Client-side filter for schedule month pages.
 * Progressive enhancement — pages remain usable without JS.
 */
(function () {
  function init() {
    const input = document.getElementById('schedule-filter');
    if (!input) return;

    const empty = document.querySelector('[data-schedule-empty]');
    const lists = document.querySelectorAll('[data-schedule-list]');

    function apply() {
      const q = (input.value || '').trim().toLowerCase();
      let visible = 0;
      lists.forEach(function (list) {
        list.querySelectorAll('[data-search]').forEach(function (el) {
          const hay = el.getAttribute('data-search') || '';
          const show = !q || hay.indexOf(q) !== -1;
          el.classList.toggle('hidden', !show);
          if (show) visible += 1;
        });
      });
      // cards + table rows both match — divide by number of lists roughly
      const uniqueVisible = Math.ceil(visible / Math.max(lists.length, 1));
      if (empty) empty.classList.toggle('hidden', uniqueVisible > 0 || !q);
    }

    input.addEventListener('input', apply);
    input.addEventListener('search', apply);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
