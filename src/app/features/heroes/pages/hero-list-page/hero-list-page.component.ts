import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageEvent } from '@angular/material/paginator';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
} from 'rxjs';

import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { HeroSearchComponent } from '../../components/hero-search/hero-search.component';
import { HeroTableComponent } from '../../components/hero-table/hero-table.component';
import { HeroListQueryService } from '../../data-access/hero-list-query.service';
import { HeroService } from '../../data-access/hero.service';
import { HeroSort, parseHeroSort, serializeHeroSort, sortHeroes } from '../../models/hero-sort';
import { Hero } from '../../models/hero.model';

export const SEARCH_DEBOUNCE_MS = new InjectionToken<number>('SEARCH_DEBOUNCE_MS', {
  providedIn: 'root',
  factory: () => 300,
});

export const PAGE_SIZE_OPTIONS = [5, 10, 25] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

/** `page` is 1-based in the URL; anything that is not a positive integer means the first page. */
const toPageNumber = (value: string | undefined): number => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const toPageSize = (value: string | undefined): number => {
  const size = Number(value);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
};

const lastPageIndex = (total: number, pageSize: number): number =>
  Math.max(0, Math.ceil(total / pageSize) - 1);

/**
 * Container: the URL query (`q`, `page`, `size`, `sort`) is the single source of truth for the
 * list, so reloading, sharing a link or using back/forward restores the same view.
 * Child components stay presentational and communicate only through inputs and output events.
 */
@Component({
  selector: 'app-hero-list-page',
  imports: [HeroSearchComponent, HeroTableComponent, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-list-page.component.html',
  styleUrl: './hero-list-page.component.scss',
})
export class HeroListPageComponent {
  private readonly heroService = inject(HeroService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Query parameters, bound by the router.
  readonly q = input<string>();
  readonly page = input(1, { transform: toPageNumber });
  readonly size = input(DEFAULT_PAGE_SIZE, { transform: toPageSize });
  readonly sort = input(undefined, { transform: parseHeroSort });

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  /** What the search box shows: follows the URL, but updates instantly while typing. */
  protected readonly term = linkedSignal(() => this.q() ?? '');
  private readonly typedTerm$ = new Subject<string>();
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  private readonly heroes = toSignal(
    combineLatest([
      toObservable(this.q).pipe(
        map((term) => (term ?? '').trim()),
        distinctUntilChanged(),
      ),
      this.reload$,
    ]).pipe(switchMap(([term]) => this.heroService.searchByName(term))),
  );

  protected readonly sortedHeroes = computed(() => {
    const heroes = this.heroes();
    return heroes && sortHeroes(heroes, this.sort());
  });

  /** Clamped so an out-of-range `page` (or a page emptied by a delete) shows the last page. */
  protected readonly pageIndex = computed(() =>
    Math.min(this.page() - 1, lastPageIndex(this.sortedHeroes()?.length ?? 0, this.size())),
  );

  constructor() {
    this.typedTerm$
      .pipe(
        debounceTime(inject(SEARCH_DEBOUNCE_MS)),
        map((term) => term.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((term) => this.updateQuery({ q: term || null, page: null }, true));

    const listQuery = inject(HeroListQueryService);
    this.route.queryParams
      .pipe(takeUntilDestroyed())
      .subscribe((params) => listQuery.remember(params));
  }

  protected onTermChange(term: string): void {
    this.term.set(term);
    this.typedTerm$.next(term);
  }

  protected onPage({ pageIndex, pageSize }: PageEvent): void {
    this.updateQuery({
      page: pageIndex > 0 ? pageIndex + 1 : null,
      size: pageSize !== DEFAULT_PAGE_SIZE ? pageSize : null,
    });
  }

  protected onSort(sort: HeroSort | undefined): void {
    this.updateQuery({ sort: serializeHeroSort(sort), page: null });
  }

  protected onAdd(): void {
    void this.router.navigate(['/heroes', 'new']);
  }

  protected onEdit(hero: Hero): void {
    void this.router.navigate(['/heroes', hero.id, 'edit']);
  }

  protected onRemove(hero: Hero): void {
    this.confirmDialog
      .confirm({
        title: 'Delete hero',
        message: `Are you sure you want to delete ${hero.name}?`,
        confirmLabel: 'Delete',
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.heroService.delete(hero.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notifications.success(`${hero.name} was deleted`);
          this.reload$.next();
        },
        error: (error: Error) => this.notifications.error(error.message),
      });
  }

  private updateQuery(changes: Params, replaceUrl = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
