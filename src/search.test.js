import test from 'node:test';
import assert from 'node:assert/strict';
import { findRoutes, routes } from './search.js';

test('empty search returns all demo routes', () => assert.deepEqual(findRoutes(), routes));
test('matches the requested route direction', () => {
  const matches = findRoutes({ from: 'Manila', to: 'Batangas' });
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, 1);
  assert.equal(findRoutes({ from: 'Batangas', to: 'Manila' })[0].id, 5);
});
test('filters by available cargo capacity', () => {
  assert.equal(findRoutes({ from: 'Manila', weight: '1000' }).length, 1);
  assert.equal(findRoutes({ from: 'Manila', to: 'Batangas', weight: '800' }).length, 1);
  assert.equal(findRoutes({ weight: '3000' }).length, 0);
});
test('unavailable and invalid searches return no matches', () => {
  assert.equal(findRoutes({ from: 'Baguio', to: 'Davao' }).length, 0);
  assert.equal(findRoutes({ weight: '-1' }).length, 0);
  assert.equal(findRoutes({ weight: 'invalid' }).length, 0);
});
