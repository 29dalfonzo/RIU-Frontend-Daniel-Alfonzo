import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-hero-search',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search">
      <mat-label>Filter by name</mat-label>
      <mat-icon matPrefix>search</mat-icon>
      <input
        #box
        matInput
        type="search"
        autocomplete="off"
        placeholder="e.g. man"
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
      }
    </mat-form-field>
  `,
  styles: `
    .search {
      width: 100%;
    }
  `,
})
export class HeroSearchComponent {
  /** Two-way bindable search term; every change is emitted as a `termChange` event. */
  readonly term = model('');
}
