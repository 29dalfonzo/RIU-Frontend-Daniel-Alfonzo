import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Hero } from '../../models/hero.model';

const lastPageIndex = (total: number, pageSize: number): number =>
  Math.max(0, Math.ceil(total / pageSize) - 1);

@Component({
  selector: 'app-hero-table',
  imports: [MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-table.component.html',
  styleUrl: './hero-table.component.scss',
})
export class HeroTableComponent {
  readonly heroes = input.required<readonly Hero[]>();
  readonly edit = output<Hero>();
  readonly remove = output<Hero>();

  protected readonly columns = [
    'id',
    'name',
    'realName',
    'publisher',
    'firstAppearance',
    'actions',
  ];
  protected readonly pageSizeOptions = [5, 10, 25];
  protected readonly pageSize = signal(this.pageSizeOptions[0]);

  /** Follows the input list, keeping the current page while it still exists. */
  protected readonly pageIndex = linkedSignal<readonly Hero[], number>({
    source: this.heroes,
    computation: (heroes, previous) =>
      Math.min(previous?.value ?? 0, lastPageIndex(heroes.length, this.pageSize())),
  });

  protected readonly visibleHeroes = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.heroes().slice(start, start + this.pageSize());
  });

  protected onPage({ pageIndex, pageSize }: PageEvent): void {
    this.pageSize.set(pageSize);
    this.pageIndex.set(pageIndex);
  }
}
