import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HeroSort, HeroSortField } from '../../models/hero-sort';
import { Hero, HeroId } from '../../models/hero.model';
import { HeroAvatarComponent } from '../hero-avatar/hero-avatar.component';
import { PublisherBadgeComponent } from '../publisher-badge/publisher-badge.component';

/**
 * Presentational, controlled table: the parent owns page and sort state (kept in the URL)
 * and the table only renders the requested slice and emits the user's intent.
 */
@Component({
  selector: 'app-hero-table',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    HeroAvatarComponent,
    PublisherBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-table.component.html',
  styleUrl: './hero-table.component.scss',
})
export class HeroTableComponent {
  readonly heroes = input.required<readonly Hero[]>();
  readonly pageIndex = input(0);
  readonly pageSize = input(5);
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 25]);
  readonly sort = input<HeroSort>();
  /** Hero to flash, e.g. the one that was just created or edited. */
  readonly highlightId = input<HeroId>();

  readonly edit = output<Hero>();
  readonly remove = output<Hero>();
  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<HeroSort | undefined>();

  protected readonly columns = [
    'id',
    'name',
    'realName',
    'publisher',
    'firstAppearance',
    'actions',
  ];

  protected readonly visibleHeroes = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.heroes().slice(start, start + this.pageSize());
  });

  protected onSort({ active, direction }: Sort): void {
    this.sortChange.emit(direction ? { field: active as HeroSortField, direction } : undefined);
  }
}
