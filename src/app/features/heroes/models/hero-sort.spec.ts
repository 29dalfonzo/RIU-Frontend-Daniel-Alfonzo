import { HERO_FIXTURES } from '../testing/hero.fixtures';
import { parseHeroSort, serializeHeroSort, sortHeroes } from './hero-sort';

describe('hero sort', () => {
  describe('parseHeroSort', () => {
    it('reads a field and a direction', () => {
      expect(parseHeroSort('name:desc')).toEqual({ field: 'name', direction: 'desc' });
      expect(parseHeroSort('firstAppearance:asc')).toEqual({
        field: 'firstAppearance',
        direction: 'asc',
      });
    });

    it('ignores missing or unknown values', () => {
      expect(parseHeroSort(undefined)).toBeUndefined();
      expect(parseHeroSort('')).toBeUndefined();
      expect(parseHeroSort('power:asc')).toBeUndefined();
      expect(parseHeroSort('name:sideways')).toBeUndefined();
      expect(parseHeroSort('name')).toBeUndefined();
    });
  });

  it('serializes back to the query parameter format', () => {
    expect(serializeHeroSort({ field: 'publisher', direction: 'asc' })).toBe('publisher:asc');
    expect(serializeHeroSort(undefined)).toBeNull();
  });

  describe('sortHeroes', () => {
    const names = (sorted: readonly { name: string }[]): string[] =>
      sorted.map((hero) => hero.name);

    it('keeps the original order without a sort', () => {
      expect(sortHeroes(HERO_FIXTURES, undefined)).toBe(HERO_FIXTURES);
    });

    it('sorts text fields alphabetically in both directions', () => {
      expect(
        names(sortHeroes(HERO_FIXTURES, { field: 'name', direction: 'asc' })).slice(0, 3),
      ).toEqual(['BATMAN', 'IRON MAN', 'MANOLITO EL FUERTE']);
      expect(names(sortHeroes(HERO_FIXTURES, { field: 'name', direction: 'desc' }))[0]).toBe(
        'WONDER WOMAN',
      );
    });

    it('sorts numeric fields numerically', () => {
      const sorted = sortHeroes(HERO_FIXTURES, { field: 'firstAppearance', direction: 'asc' });

      expect(sorted.map((hero) => hero.firstAppearance)).toEqual([
        1938, 1939, 1941, 1962, 1962, 1963, 1990,
      ]);
    });

    it('does not mutate the input list', () => {
      const original = [...HERO_FIXTURES];

      sortHeroes(HERO_FIXTURES, { field: 'name', direction: 'asc' });

      expect(HERO_FIXTURES).toEqual(original);
    });
  });
});
