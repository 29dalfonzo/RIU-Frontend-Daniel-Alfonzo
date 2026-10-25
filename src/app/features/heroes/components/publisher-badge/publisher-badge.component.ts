import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Publisher } from '../../models/hero.model';

@Component({
  selector: 'app-publisher-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ publisher() }}`,
  host: {
    '[class]': '"publisher-" + publisher().toLowerCase()',
  },
  styles: `
    :host {
      display: inline-block;
      padding: 2px 10px;
      border: 2px solid var(--app-outline);
      border-radius: 999px;
      background-color: var(--app-publisher-color);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
    }
  `,
})
export class PublisherBadgeComponent {
  readonly publisher = input.required<Publisher>();
}
