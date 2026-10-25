import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { UppercaseDirective } from '../../../../shared/directives/uppercase.directive';
import { Hero, HeroDraft, PUBLISHERS, Publisher } from '../../models/hero.model';

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 40;
export const REAL_NAME_MAX_LENGTH = 60;
export const FIRST_YEAR = 1900;

/** Presentational form: validates and emits a draft, persistence is the parent's job. */
@Component({
  selector: 'app-hero-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    UppercaseDirective,
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

  constructor() {
    effect(() => {
      const hero = this.hero();
      if (hero) {
        this.form.reset({
          name: hero.name,
          realName: hero.realName,
          publisher: hero.publisher,
          firstAppearance: hero.firstAppearance,
        });
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
}
