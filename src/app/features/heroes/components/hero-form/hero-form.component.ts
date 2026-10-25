import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { outputFromObservable, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { distinctUntilChanged, map } from 'rxjs';

import { UppercaseDirective } from '../../../../shared/directives/uppercase.directive';
import { EditableHeroDraft, Hero, HeroDraft, PUBLISHERS, Publisher } from '../../models/hero.model';
import { HeroPreviewComponent } from '../hero-preview/hero-preview.component';

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 40;
export const REAL_NAME_MAX_LENGTH = 60;
export const FIRST_YEAR = 1900;

const EMPTY_DRAFT: EditableHeroDraft = {
  name: '',
  realName: '',
  publisher: null,
  firstAppearance: null,
};

const toEditableDraft = (hero: Hero | undefined): EditableHeroDraft =>
  hero
    ? {
        name: hero.name,
        realName: hero.realName,
        publisher: hero.publisher,
        firstAppearance: hero.firstAppearance,
      }
    : EMPTY_DRAFT;

const sameDraft = (a: EditableHeroDraft, b: EditableHeroDraft): boolean =>
  (Object.keys(EMPTY_DRAFT) as (keyof EditableHeroDraft)[]).every((key) => a[key] === b[key]);

/** Presentational form: validates and emits a draft, persistence is the parent's job. */
@Component({
  selector: 'app-hero-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    UppercaseDirective,
    HeroPreviewComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-form.component.html',
  styleUrl: './hero-form.component.scss',
})
export class HeroFormComponent {
  readonly hero = input<Hero>();
  readonly busy = input(false);
  readonly save = output<HeroDraft>();
  readonly cancelled = output<void>();

  protected readonly publishers = PUBLISHERS;
  protected readonly limits = {
    nameMin: NAME_MIN_LENGTH,
    nameMax: NAME_MAX_LENGTH,
    realNameMax: REAL_NAME_MAX_LENGTH,
    firstYear: FIRST_YEAR,
    lastYear: new Date().getFullYear(),
  };

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(NAME_MIN_LENGTH),
        Validators.maxLength(NAME_MAX_LENGTH),
      ],
    ],
    realName: ['', [Validators.required, Validators.maxLength(REAL_NAME_MAX_LENGTH)]],
    publisher: this.fb.control<Publisher | null>(null, Validators.required),
    firstAppearance: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(this.limits.firstYear),
      Validators.max(this.limits.lastYear),
    ]),
  });

  /** Current form value as a signal; feeds the live preview and change tracking. */
  protected readonly draft = toSignal(
    this.form.valueChanges.pipe(map((): EditableHeroDraft => this.form.getRawValue())),
    { initialValue: EMPTY_DRAFT },
  );

  /** True while the form differs from what it started with (empty, or the hero being edited). */
  protected readonly hasChanges = computed(
    () => !sameDraft(this.draft(), toEditableDraft(this.hero())),
  );

  readonly changed = outputFromObservable(
    toObservable(this.hasChanges).pipe(distinctUntilChanged()),
  );

  /** Editing without changes has nothing to save; creating always validates on submit. */
  protected readonly saveDisabled = computed(
    () => this.busy() || (!!this.hero() && !this.hasChanges()),
  );

  constructor() {
    effect(() => {
      const hero = this.hero();
      if (hero) {
        this.form.reset(toEditableDraft(hero));
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidField();
      return;
    }

    const { name, realName, publisher, firstAppearance } = this.form.getRawValue();
    // Both are guaranteed by the required validators checked above.
    this.save.emit({
      name,
      realName,
      publisher: publisher as Publisher,
      firstAppearance: firstAppearance as number,
    });
  }

  /** Uses the form model (not CSS classes, which update on the next render) to find the field. */
  private focusFirstInvalidField(): void {
    const invalid = Object.entries(this.form.controls).find(([, control]) => control.invalid);
    if (invalid) {
      this.host.nativeElement
        .querySelector<HTMLElement>(`[formControlName="${invalid[0]}"]`)
        ?.focus();
    }
  }
}
