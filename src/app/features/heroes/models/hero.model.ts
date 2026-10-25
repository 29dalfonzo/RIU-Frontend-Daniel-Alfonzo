export const PUBLISHERS = ['Marvel', 'DC', 'Other'] as const;

export type Publisher = (typeof PUBLISHERS)[number];

export type HeroId = number;

export interface Hero {
  readonly id: HeroId;
  readonly name: string;
  readonly realName: string;
  readonly publisher: Publisher;
  readonly firstAppearance: number;
}

/** Payload used to register a hero: the store owns identity generation. */
export type HeroDraft = Omit<Hero, 'id'>;

export class HeroNotFoundError extends Error {
  constructor(readonly heroId: HeroId) {
    super(`Hero with id ${heroId} was not found`);
    this.name = 'HeroNotFoundError';
  }
}

export class DuplicateHeroNameError extends Error {
  constructor(readonly heroName: string) {
    super(`A hero named "${heroName}" already exists`);
    this.name = 'DuplicateHeroNameError';
  }
}
