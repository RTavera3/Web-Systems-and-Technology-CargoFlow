import { describe, it, expect } from 'vitest';
import { findRoutes, routes } from './search.js';

describe('findRoutes', () => {
  it('returns all demo routes for an empty search', () => {
    expect(findRoutes()).toEqual(routes);
  });

  it('matches the requested route direction', () => {
    const matches = findRoutes({ from: 'Manila', to: 'Batangas' });
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe(1);
    expect(findRoutes({ from: 'Batangas', to: 'Manila' })[0].id).toBe(5);
  });

  it('filters by available cargo capacity', () => {
    expect(findRoutes({ from: 'Manila', weight: '1000' })).toHaveLength(1);
    expect(
      findRoutes({ from: 'Manila', to: 'Batangas', weight: '800' }),
    ).toHaveLength(1);
    expect(findRoutes({ weight: '3000' })).toHaveLength(0);
  });

  it('returns no matches for unavailable or invalid searches', () => {
    expect(findRoutes({ from: 'Baguio', to: 'Davao' })).toHaveLength(0);
    expect(findRoutes({ weight: '-1' })).toHaveLength(0);
    expect(findRoutes({ weight: 'invalid' })).toHaveLength(0);
  });
});
