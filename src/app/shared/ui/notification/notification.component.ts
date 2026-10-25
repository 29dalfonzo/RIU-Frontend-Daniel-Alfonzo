import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type NotificationKind = 'success' | 'info' | 'error';

export interface NotificationData {
  readonly message: string;
  readonly kind: NotificationKind;
  readonly actionLabel?: string;
}

const ICONS: Record<NotificationKind, string> = {
  success: 'check',
  info: 'bolt',
  error: 'priority_high',
};

/** Comic-styled snackbar content: kind icon, message, optional action and a dismiss button. */
@Component({
  selector: 'app-notification',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="icon-badge" aria-hidden="true">
      <mat-icon class="icon">{{ icon }}</mat-icon>
    </span>
    <span class="message">{{ data.message }}</span>
    @if (data.actionLabel) {
      <button
        mat-button
        type="button"
        class="action"
        data-testid="notification-action"
        (click)="ref.dismissWithAction()"
      >
        {{ data.actionLabel }}
      </button>
    }
    <button
      mat-icon-button
      type="button"
      class="dismiss"
      aria-label="Dismiss"
      (click)="ref.dismiss()"
    >
      <mat-icon>close</mat-icon>
    </button>
  `,
  styleUrl: './notification.component.scss',
})
export class NotificationComponent {
  protected readonly data = inject<NotificationData>(MAT_SNACK_BAR_DATA);
  protected readonly ref = inject(MatSnackBarRef);
  protected readonly icon = ICONS[this.data.kind];
}
