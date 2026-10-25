import { Hero } from './hero.model';

export const HERO_SORT_FIELDS = ['id', 'name', 'realName', 'publisher', 'firstAppearance'] as const;

export type HeroSortField = (typeof HERO_SORT_FIELDS)[number];
export type SortDirection = 'asc' | 'desc';

export interface HeroSort {
  readonly field: HeroSortField;
  readonly direction: SortDirection;
}

const isSortField = (value: string): value is HeroSortField =>
  (HERO_SORT_FIELDS as readonly string[]).includes(value);

const isDirection = (value: string): value is SortDirection => value === 'asc' || value === 'desc';

/** Reads the `sort` query parameter (`field:direction`); anything invalid means "no sort". */
export const parseHeroSort = (value: string | undefined): HeroSort | undefined => {
  const [field = '', direction = ''] = (value ?? '').split(':');
  return isSortField(field) && isDirection(direction) ? { field, direction } : undefined;
};

export const serializeHeroSort = (sort: HeroSort | undefined): string | null =>
  sort ? `${sort.field}:${sort.direction}` : null;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/** Returns a sorted copy; without a sort it returns the same list untouched. */
export const sortHeroes = (
  heroes: readonly Hero[],
  sort: HeroSort | undefined,
): readonly Hero[] => {
  if (!sort) {
    return heroes;
  }
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...heroes].sort(
    (a, b) => factor * collator.compare(String(a[sort.field]), String(b[sort.field])),
  );
};
