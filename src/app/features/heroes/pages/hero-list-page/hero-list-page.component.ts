import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
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
  take,
  tap,
} from 'rxjs';

import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { HeroSearchComponent } from '../../components/hero-search/hero-search.component';
import { HeroTableComponent } from '../../components/hero-table/hero-table.component';
import { HeroListQueryService } from '../../data-access/hero-list-query.service';
import { HeroService } from '../../data-access/hero.service';
import { HeroSort, parseHeroSort, serializeHeroSort, sortHeroes } from '../../models/hero-sort';
import { Hero, HeroId } from '../../models/hero.model';

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

const pluralize = (count: number): string => `${count} ${count === 1 ? 'hero' : 'heroes'}`;

const isEditable = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

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
  host: { '(document:keydown)': 'onShortcut($event)' },
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
  protected readonly skeletonRows = Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => index);

  /** Hero to flash after returning from a form, passed in the navigation state. */
  protected readonly highlightId: HeroId | undefined =
    this.router.currentNavigation()?.extras.state?.['highlightId'];

  private readonly searchBox = viewChild.required(HeroSearchComponent);

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

  protected readonly countLabel = computed(() => {
    const heroes = this.sortedHeroes();
    return heroes ? pluralize(heroes.length) : '';
  });

  /** Announced to screen readers when a search finishes. */
  protected readonly announcement = computed(() => {
    const heroes = this.sortedHeroes();
    return heroes && this.q() ? `${pluralize(heroes.length)} found` : '';
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

    toObservable(this.sortedHeroes)
      .pipe(filter(Boolean), take(1), takeUntilDestroyed())
      .subscribe((heroes) => this.showHighlightedHero(heroes));
  }

  protected onShortcut(event: KeyboardEvent): void {
    if (event.key === '/' && !isEditable(event.target)) {
      event.preventDefault();
      this.searchBox().focus();
    }
  }

  protected onClearFilter(): void {
    this.onTermChange('');
    this.updateQuery({ q: null, page: null });
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
        subject: hero.name,
        message: 'This hero will leave the registry. You can undo it right after.',
        confirmLabel: 'Delete',
        danger: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.heroService.delete(hero.id)),
        tap(() => this.reload$.next()),
        switchMap(() => this.notifications.action(`${hero.name} was deleted`, 'Undo')),
        switchMap(() => this.heroService.restore(hero)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.notifications.success(`${hero.name} was restored`);
          this.reload$.next();
        },
        error: (error: Error) => this.notifications.error(error.message),
      });
  }

  /** Moves to the page that contains the highlighted hero, so the user sees what they saved. */
  private showHighlightedHero(heroes: readonly Hero[]): void {
    const index = heroes.findIndex((hero) => hero.id === this.highlightId);
    if (index < 0) {
      return;
    }
    const page = Math.floor(index / this.size()) + 1;
    if (page !== this.pageIndex() + 1) {
      this.updateQuery({ page: page > 1 ? page : null }, true);
    }
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
