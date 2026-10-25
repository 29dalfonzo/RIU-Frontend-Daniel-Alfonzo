import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { LoadingService } from '../../../core/loading/loading.service';
import { DuplicateHeroNameError, Hero, HeroNotFoundError } from '../models/hero.model';
import { HERO_INITIAL_STATE, HERO_LATENCY_MS, HeroService } from './hero.service';

const SEED: readonly Hero[] = [
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
];

describe('HeroService', () => {
  let service: HeroService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HERO_INITIAL_STATE, useValue: SEED },
        { provide: HERO_LATENCY_MS, useValue: 0 },
      ],
    });
    service = TestBed.inject(HeroService);
  });

  describe('getAll', () => {
    it('returns every stored hero', async () => {
      const heroes = await firstValueFrom(service.getAll());

      expect(heroes).toEqual(SEED);
    });
  });

  describe('getById', () => {
    it('returns the hero matching the id', async () => {
      const hero = await firstValueFrom(service.getById(2));

      expect(hero).toEqual(SEED[1]);
    });

    it('fails with HeroNotFoundError when the id does not exist', async () => {
      await expect(firstValueFrom(service.getById(99))).rejects.toBeInstanceOf(HeroNotFoundError);
    });
  });

  describe('searchByName', () => {
    it('returns heroes whose name contains the term, ignoring case', async () => {
      const heroes = await firstValueFrom(service.searchByName('man'));

      expect(heroes.map((hero) => hero.name)).toEqual([
        'SPIDERMAN',
        'SUPERMAN',
        'MANOLITO EL FUERTE',
        'BATMAN',
      ]);
    });

    it('ignores surrounding whitespace in the term', async () => {
      const heroes = await firstValueFrom(service.searchByName('  bat '));

      expect(heroes.map((hero) => hero.name)).toEqual(['BATMAN']);
    });

    it('returns every hero when the term is blank', async () => {
      const heroes = await firstValueFrom(service.searchByName('   '));

      expect(heroes).toEqual(SEED);
    });

    it('returns an empty list when nothing matches', async () => {
      const heroes = await firstValueFrom(service.searchByName('xyz'));

      expect(heroes).toEqual([]);
    });
  });

  describe('create', () => {
    it('registers a new hero with the next available id', async () => {
      const created = await firstValueFrom(
        service.create({
          name: 'Thor',
          realName: 'Thor Odinson',
          publisher: 'Marvel',
          firstAppearance: 1962,
        }),
      );

      expect(created).toEqual({
        id: 5,
        name: 'THOR',
        realName: 'Thor Odinson',
        publisher: 'Marvel',
        firstAppearance: 1962,
      });
      expect(await firstValueFrom(service.getById(5))).toEqual(created);
    });

    it('normalizes the name to trimmed upper case', async () => {
      const created = await firstValueFrom(
        service.create({
          name: '  hulk  ',
          realName: ' Bruce Banner ',
          publisher: 'Marvel',
          firstAppearance: 1962,
        }),
      );

      expect(created.name).toBe('HULK');
      expect(created.realName).toBe('Bruce Banner');
    });

    it('rejects a duplicated name and leaves the store unchanged', async () => {
      await expect(
        firstValueFrom(
          service.create({
            name: 'superman',
            realName: 'Other',
            publisher: 'DC',
            firstAppearance: 2000,
          }),
        ),
      ).rejects.toBeInstanceOf(DuplicateHeroNameError);

      expect(await firstValueFrom(service.getAll())).toEqual(SEED);
    });
  });

  describe('update', () => {
    it('modifies the stored hero and returns it', async () => {
      const updated = await firstValueFrom(
        service.update({ ...SEED[0], realName: 'Miles Morales' }),
      );

      expect(updated).toEqual({ ...SEED[0], realName: 'Miles Morales' });
      expect(await firstValueFrom(service.getById(1))).toEqual(updated);
    });

    it('allows keeping the same name', async () => {
      const updated = await firstValueFrom(service.update({ ...SEED[1], name: 'superman' }));

      expect(updated.name).toBe('SUPERMAN');
    });

    it('rejects a name already used by another hero', async () => {
      await expect(
        firstValueFrom(service.update({ ...SEED[0], name: 'Batman' })),
      ).rejects.toBeInstanceOf(DuplicateHeroNameError);

      expect(await firstValueFrom(service.getById(1))).toEqual(SEED[0]);
    });

    it('fails with HeroNotFoundError when the hero does not exist', async () => {
      await expect(firstValueFrom(service.update({ ...SEED[0], id: 99 }))).rejects.toBeInstanceOf(
        HeroNotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('removes the hero from the store', async () => {
      await firstValueFrom(service.delete(3));

      const heroes = await firstValueFrom(service.getAll());
      expect(heroes.map((hero) => hero.id)).toEqual([1, 2, 4]);
    });

    it('fails with HeroNotFoundError when the hero does not exist', async () => {
      await expect(firstValueFrom(service.delete(99))).rejects.toBeInstanceOf(HeroNotFoundError);

      expect(await firstValueFrom(service.getAll())).toEqual(SEED);
    });
  });

  it('never exposes the internal state for mutation', async () => {
    const heroes = await firstValueFrom(service.getAll());

    expect(Object.isFrozen(heroes)).toBe(true);
  });

  it('reports the app as loading while an operation is in flight', async () => {
    const loading = TestBed.inject(LoadingService);

    const deletion = firstValueFrom(service.delete(1));
    expect(loading.isLoading()).toBe(true);

    await deletion;
    expect(loading.isLoading()).toBe(false);
  });
});
