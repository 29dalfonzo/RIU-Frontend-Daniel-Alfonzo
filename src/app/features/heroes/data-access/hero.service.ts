import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import {
  DuplicateHeroNameError,
  Hero,
  HeroDraft,
  HeroId,
  HeroNotFoundError,
} from '../models/hero.model';
import { HERO_SEED } from './hero.seed';

export const HERO_INITIAL_STATE = new InjectionToken<readonly Hero[]>('HERO_INITIAL_STATE', {
  providedIn: 'root',
  factory: () => HERO_SEED,
});

/** Simulated network latency, so the UI behaves as it would against a real API. */
export const HERO_LATENCY_MS = new InjectionToken<number>('HERO_LATENCY_MS', {
  providedIn: 'root',
  factory: () => 400,
});

const freezeAll = (heroes: readonly Hero[]): readonly Hero[] =>
  Object.freeze(heroes.map((hero) => Object.freeze({ ...hero })));

const normalizeName = (name: string): string => name.trim().toUpperCase();

const normalize = <T extends HeroDraft>(hero: T): T => ({
  ...hero,
  name: normalizeName(hero.name),
  realName: hero.realName.trim(),
});

/**
 * In-memory hero store. State lives in the service (no backend) and every
 * operation is exposed as a cold Observable that resolves after a simulated latency.
 */
@Injectable({ providedIn: 'root' })
export class HeroService {
  private readonly latencyMs = inject(HERO_LATENCY_MS);
  private readonly heroes = signal<readonly Hero[]>(freezeAll(inject(HERO_INITIAL_STATE)));

  getAll(): Observable<readonly Hero[]> {
    return this.respond(() => this.heroes());
  }

  getById(id: HeroId): Observable<Hero> {
    return this.respond(() => this.findOrFail(id));
  }

  searchByName(term: string): Observable<readonly Hero[]> {
    const needle = normalizeName(term);
    return this.respond(() => this.heroes().filter((hero) => hero.name.includes(needle)));
  }

  create(draft: HeroDraft): Observable<Hero> {
    return this.respond(() => {
      const hero: Hero = { ...normalize(draft), id: this.nextId() };
      this.assertNameIsAvailable(hero);
      this.commit([...this.heroes(), hero]);
      return this.findOrFail(hero.id);
    });
  }

  update(changes: Hero): Observable<Hero> {
    return this.respond(() => {
      this.findOrFail(changes.id);
      const hero = normalize(changes);
      this.assertNameIsAvailable(hero);
      this.commit(this.heroes().map((current) => (current.id === hero.id ? hero : current)));
      return this.findOrFail(hero.id);
    });
  }

  delete(id: HeroId): Observable<void> {
    return this.respond(() => {
      this.findOrFail(id);
      this.commit(this.heroes().filter((hero) => hero.id !== id));
    });
  }

  /** Runs the operation lazily, on subscription, once the simulated latency has elapsed. */
  private respond<T>(operation: () => T): Observable<T> {
    return timer(this.latencyMs).pipe(map(() => operation()));
  }

  private commit(heroes: readonly Hero[]): void {
    this.heroes.set(freezeAll(heroes));
  }

  private findOrFail(id: HeroId): Hero {
    const hero = this.heroes().find((current) => current.id === id);
    if (!hero) {
      throw new HeroNotFoundError(id);
    }
    return hero;
  }

  private assertNameIsAvailable({ id, name }: Pick<Hero, 'id' | 'name'>): void {
    if (this.heroes().some((hero) => hero.name === name && hero.id !== id)) {
      throw new DuplicateHeroNameError(name);
    }
  }

  private nextId(): HeroId {
    return this.heroes().reduce((max, hero) => Math.max(max, hero.id), 0) + 1;
  }
}
