import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Observable, catchError, finalize, of, switchMap } from 'rxjs';

import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { HeroFormComponent } from '../../components/hero-form/hero-form.component';
import { HeroListQueryService } from '../../data-access/hero-list-query.service';
import { HeroService } from '../../data-access/hero.service';
import { Hero, HeroDraft, HeroId } from '../../models/hero.model';
import { SavedHeroNotice } from '../../models/saved-hero-notice';
import { HasUnsavedChanges } from './unsaved-changes.guard';

const toHeroId = (value: string | undefined): HeroId | undefined =>
  value === undefined ? undefined : Number(value);

/** Container for both create (`/heroes/new`) and edit (`/heroes/:id/edit`) routes. */
@Component({
  selector: 'app-hero-form-page',
  imports: [HeroFormComponent, RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-form-page.component.html',
  styleUrl: './hero-form-page.component.scss',
})
export class HeroFormPageComponent implements HasUnsavedChanges {
  private readonly heroService = inject(HeroService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly listQuery = inject(HeroListQueryService);
  private readonly destroyRef = inject(DestroyRef);

  /** Bound from the `:id` route parameter; absent when creating. */
  readonly id = input<HeroId | undefined, string | undefined>(undefined, { transform: toHeroId });

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly saving = signal(false);
  protected readonly listQueryParams = this.listQuery.lastQuery;
  private readonly unsaved = signal(false);

  protected readonly hero = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) => (id === undefined ? of(undefined) : this.loadHero(id))),
    ),
  );

  protected readonly title = computed(() => {
    const hero = this.hero();
    return hero ? `Edit ${hero.name}` : 'New hero';
  });

  hasUnsavedChanges(): boolean {
    return this.unsaved();
  }

  protected onChanged(changed: boolean): void {
    this.unsaved.set(changed);
  }

  protected onSave(draft: HeroDraft): void {
    const id = this.id();
    const request$ =
      id === undefined ? this.heroService.create(draft) : this.heroService.update({ ...draft, id });
    const action = id === undefined ? 'created' : 'updated';

    this.saving.set(true);
    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (hero) => {
          this.unsaved.set(false);
          this.backToList({ id: hero.id, message: `${hero.name} was ${action}` });
        },
        error: (error: Error) => this.notifications.error(error.message),
      });
  }

  /** Returns to the list view the user came from; the list announces a saved hero. */
  protected backToList(savedHero?: SavedHeroNotice): void {
    const queryParams = this.listQuery.lastQuery();
    void this.router.navigate(
      ['/heroes'],
      savedHero ? { queryParams, state: { savedHero } } : { queryParams },
    );
  }

  private loadHero(id: HeroId): Observable<Hero> {
    return this.heroService.getById(id).pipe(
      catchError((error: Error) => {
        this.notifications.error(error.message);
        this.backToList();
        return EMPTY;
      }),
    );
  }
}
