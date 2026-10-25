import { ChangeDetectionStrategy, Component, ElementRef, model, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-hero-search',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field
      appearance="outline"
      floatLabel="always"
      subscriptSizing="dynamic"
      class="search"
    >
      <mat-label>Filter by name</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input
        #box
        matInput
        type="search"
        autocomplete="off"
        placeholder="e.g. man"
        aria-keyshortcuts="/"
        [value]="term()"
        (input)="term.set(box.value)"
      />
      @if (term()) {
        <button
          matSuffix
          mat-icon-button
          type="button"
          aria-label="Clear search"
          (click)="term.set('')"
        >
          <mat-icon>close</mat-icon>
        </button>
      } @else {
        <kbd matSuffix class="shortcut" aria-hidden="true">/</kbd>
      }
    </mat-form-field>
  `,
  styles: `
    .search {
      width: 100%;
    }

    .shortcut {
      display: none;
      place-items: center;
      min-width: 24px;
      height: 24px;
      margin-inline-end: 12px;
      border: 2px solid var(--mat-sys-outline);
      border-radius: 6px;
      color: var(--mat-sys-on-surface-variant);
      font: 700 0.85rem/1 var(--mat-sys-body-medium-font);
    }

    @media (min-width: 768px) {
      .shortcut {
        display: inline-grid;
      }
    }
  `,
})
export class HeroSearchComponent {
  /** Two-way bindable search term; every change is emitted as a `termChange` event. */
  readonly term = model('');

  private readonly box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  focus(): void {
    this.box().nativeElement.focus();
  }
}
