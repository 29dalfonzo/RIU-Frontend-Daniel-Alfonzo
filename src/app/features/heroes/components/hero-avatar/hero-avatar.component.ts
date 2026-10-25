import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Publisher } from '../../models/hero.model';

/** Two-letter monogram: first letters of the first two words, or the first two letters. */
export const heroInitials = (name: string): string => {
  const words = name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  if (!words.length) {
    return '?';
  }
  const initials = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return initials.toUpperCase();
};

@Component({
  selector: 'app-hero-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ initials() }}`,
  host: {
    'aria-hidden': 'true',
    '[class]': '"publisher-" + publisher().toLowerCase()',
  },
  styles: `
    :host {
      display: inline-grid;
      flex: none;
      place-items: center;
      width: 40px;
      height: 40px;
      border: 2px solid var(--app-outline);
      border-radius: 50%;
      background-color: var(--app-publisher-color);
      box-shadow: 2px 2px 0 var(--app-outline);
      color: #fff;
      font-family: var(--app-font-display);
      font-size: 1.1rem;
      letter-spacing: 0.04em;
    }
  `,
})
export class HeroAvatarComponent {
  readonly name = input.required<string>();
  readonly publisher = input.required<Publisher>();

  protected readonly initials = computed(() => heroInitials(this.name()));
}
