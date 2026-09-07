/* Browser test runner for search.js. Open tests.html to run.
   Depends on `routes` and `findRoutes` from search.js (load it first). */

(function () {
  const results = [];

  function check(name, fn) {
    try {
      fn();
      results.push({ name, ok: true });
    } catch (error) {
      results.push({ name, ok: false, message: error.message });
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || 'assertion failed');
  }

  function equal(actual, expected, message) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    assert(a === b, message || `expected ${b}, got ${a}`);
  }

  check('returns all demo routes for an empty search', () => {
    equal(findRoutes(), routes);
  });

  check('matches the requested route direction', () => {
    const matches = findRoutes({ from: 'Manila', to: 'Batangas' });
    equal(matches.length, 1);
    equal(matches[0].id, 1);
    equal(findRoutes({ from: 'Batangas', to: 'Manila' })[0].id, 5);
  });

  check('filters by available cargo capacity', () => {
    equal(findRoutes({ from: 'Manila', weight: '1000' }).length, 1);
    equal(
      findRoutes({ from: 'Manila', to: 'Batangas', weight: '800' }).length,
      1
    );
    equal(findRoutes({ weight: '3000' }).length, 0);
  });

  check('returns no matches for unavailable or invalid searches', () => {
    equal(findRoutes({ from: 'Baguio', to: 'Davao' }).length, 0);
    equal(findRoutes({ weight: '-1' }).length, 0);
    equal(findRoutes({ weight: 'invalid' }).length, 0);
  });

  const passed = results.filter((result) => result.ok).length;
  const allPassed = passed === results.length;

  document.getElementById('test-results').innerHTML =
    `<p class="summary ${allPassed ? 'pass' : 'fail'}">${passed} / ${results.length} passing</p>` +
    '<ul>' +
    results
      .map(
        (result) =>
          `<li class="${result.ok ? 'pass' : 'fail'}">` +
          `${result.ok ? '✓' : '✗'} ${result.name}` +
          (result.ok ? '' : ` — ${result.message}`) +
          '</li>'
      )
      .join('') +
    '</ul>';

  const log = allPassed ? console.log : console.error;
  log(`CargoFlow route-search tests: ${passed}/${results.length} passing`);
})();
