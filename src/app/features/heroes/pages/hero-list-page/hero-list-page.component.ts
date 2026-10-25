import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  BehaviorSubject,
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
import { HeroService } from '../../data-access/hero.service';
import { Hero } from '../../models/hero.model';

export const SEARCH_DEBOUNCE_MS = new InjectionToken<number>('SEARCH_DEBOUNCE_MS', {
  providedIn: 'root',
  factory: () => 300,
});

/**
 * Container: owns the search/reload streams and talks to the service.
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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly term = signal('');
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  private readonly searchTerm$ = toObservable(this.term).pipe(
    debounceTime(inject(SEARCH_DEBOUNCE_MS)),
    map((term) => term.trim()),
    distinctUntilChanged(),
  );

  protected readonly heroes = toSignal(
    combineLatest([this.searchTerm$, this.reload$]).pipe(
      switchMap(([term]) => this.heroService.searchByName(term)),
    ),
  );

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
}
