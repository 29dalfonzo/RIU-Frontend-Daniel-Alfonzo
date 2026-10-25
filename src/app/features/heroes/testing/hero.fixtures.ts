import { Hero } from '../models/hero.model';

export const HERO_FIXTURES: readonly Hero[] = [
  {
    id: 1,
    name: 'SPIDERMAN',
    realName: 'Peter Parker',
    publisher: 'Marvel',
    firstAppearance: 1962,
  },
  { id: 2, name: 'SUPERMAN', realName: 'Clark Kent', publisher: 'DC', firstAppearance: 1938 },
  {
    id: 3,
    name: 'MANOLITO EL FUERTE',
    realName: 'Manuel García',
    publisher: 'Other',
    firstAppearance: 1990,
  },
  { id: 4, name: 'BATMAN', realName: 'Bruce Wayne', publisher: 'DC', firstAppearance: 1939 },
  { id: 5, name: 'WONDER WOMAN', realName: 'Diana Prince', publisher: 'DC', firstAppearance: 1941 },
  { id: 6, name: 'IRON MAN', realName: 'Tony Stark', publisher: 'Marvel', firstAppearance: 1963 },
  { id: 7, name: 'THOR', realName: 'Thor Odinson', publisher: 'Marvel', firstAppearance: 1962 },
];

/** Lets pending timers (debounce, simulated latency) flush and the view settle. */
export const settle = async (
  fixture: { whenStable(): Promise<unknown> },
  rounds = 3,
): Promise<void> => {
  for (let round = 0; round < rounds; round++) {
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();
  }
};
