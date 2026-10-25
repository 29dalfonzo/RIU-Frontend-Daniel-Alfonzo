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
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, of, switchMap } from 'rxjs';

import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { HeroFormComponent } from '../../components/hero-form/hero-form.component';
import { HeroListQueryService } from '../../data-access/hero-list-query.service';
import { HeroService } from '../../data-access/hero.service';
import { Hero, HeroDraft, HeroId } from '../../models/hero.model';

const toHeroId = (value: string | undefined): HeroId | undefined =>
  value === undefined ? undefined : Number(value);

/** Container for both create (`/heroes/new`) and edit (`/heroes/:id/edit`) routes. */
@Component({
  selector: 'app-hero-form-page',
  imports: [HeroFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-form-page.component.html',
  styleUrl: './hero-form-page.component.scss',
})
export class HeroFormPageComponent {
  private readonly heroService = inject(HeroService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly listQuery = inject(HeroListQueryService);
  private readonly destroyRef = inject(DestroyRef);

  /** Bound from the `:id` route parameter; absent when creating. */
  readonly id = input<HeroId | undefined, string | undefined>(undefined, { transform: toHeroId });

  protected readonly isEdit = computed(() => this.id() !== undefined);
  protected readonly saving = signal(false);

  protected readonly hero = toSignal(
    toObservable(this.id).pipe(
      switchMap((id) => (id === undefined ? of(undefined) : this.loadHero(id))),
    ),
  );

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
          this.notifications.success(`${hero.name} was ${action}`);
          this.backToList(hero.id);
        },
        error: (error: Error) => this.notifications.error(error.message),
      });
  }

  /** Returns to the list view the user came from; a saved hero is passed along to be highlighted. */
  protected backToList(highlightId?: HeroId): void {
    const queryParams = this.listQuery.lastQuery();
    void this.router.navigate(
      ['/heroes'],
      highlightId === undefined ? { queryParams } : { queryParams, state: { highlightId } },
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
