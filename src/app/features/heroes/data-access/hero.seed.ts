import { Hero } from '../models/hero.model';

export const HERO_SEED: readonly Hero[] = [
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
  {
    id: 7,
    name: 'CAPTAIN AMERICA',
    realName: 'Steve Rogers',
    publisher: 'Marvel',
    firstAppearance: 1941,
  },
  { id: 8, name: 'THOR', realName: 'Thor Odinson', publisher: 'Marvel', firstAppearance: 1962 },
  { id: 9, name: 'HULK', realName: 'Bruce Banner', publisher: 'Marvel', firstAppearance: 1962 },
  { id: 10, name: 'AQUAMAN', realName: 'Arthur Curry', publisher: 'DC', firstAppearance: 1941 },
  { id: 11, name: 'FLASH', realName: 'Barry Allen', publisher: 'DC', firstAppearance: 1956 },
  {
    id: 12,
    name: 'BLACK PANTHER',
    realName: "T'Challa",
    publisher: 'Marvel',
    firstAppearance: 1966,
  },
];
