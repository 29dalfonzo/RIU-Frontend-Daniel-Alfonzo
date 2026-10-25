import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { EditableHeroDraft } from '../../models/hero.model';
import { HeroAvatarComponent } from '../hero-avatar/hero-avatar.component';
import { PublisherBadgeComponent } from '../publisher-badge/publisher-badge.component';

/** Trading-card style preview of the hero being edited. */
@Component({
  selector: 'app-hero-preview',
  imports: [HeroAvatarComponent, PublisherBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="label">Preview</span>
    <div class="card" [class]="publisherClass()">
      <app-hero-avatar class="avatar" [name]="name()" [publisher]="hero().publisher ?? 'Other'" />
      <p class="name">{{ name() }}</p>
      <p class="real-name">{{ hero().realName.trim() || 'Secret identity' }}</p>
      <div class="meta">
        @if (hero().publisher; as publisher) {
          <app-publisher-badge [publisher]="publisher" />
        }
        <span class="year">Since {{ hero().firstAppearance ?? '????' }}</span>
      </div>
    </div>
  `,
  styleUrl: './hero-preview.component.scss',
})
export class HeroPreviewComponent {
  readonly hero = input.required<EditableHeroDraft>();

  protected readonly name = computed(() => this.hero().name.trim().toUpperCase() || 'YOUR HERO');
  protected readonly publisherClass = computed(
    () => `publisher-${(this.hero().publisher ?? 'Other').toLowerCase()}`,
  );
}
