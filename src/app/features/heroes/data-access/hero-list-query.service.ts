import { Injectable, signal } from '@angular/core';
import { Params } from '@angular/router';

/** Remembers the last list query (filter, page, sort) so the forms can return to the same view. */
@Injectable({ providedIn: 'root' })
export class HeroListQueryService {
  private readonly query = signal<Params>({});

  readonly lastQuery = this.query.asReadonly();

  remember(query: Params): void {
    this.query.set({ ...query });
  }
}
