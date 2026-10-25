import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  readonly title: string;
  readonly message: string;
  /** What the action applies to, shown prominently (e.g. the hero name). */
  readonly subject?: string;
  readonly confirmLabel?: string;
  /** Destructive actions get the error color and a warning icon. */
  readonly danger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="title">
      @if (data.danger) {
        <mat-icon class="warning" aria-hidden="true">warning</mat-icon>
      }
      {{ data.title }}
    </h2>
    <mat-dialog-content class="content">
      @if (data.subject) {
        <p class="subject">{{ data.subject }}</p>
      }
      <p class="message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="actions">
      <button mat-button type="button" [mat-dialog-close]="false" cdkFocusInitial>Cancel</button>
      <button mat-flat-button type="button" [class.danger]="data.danger" [mat-dialog-close]="true">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .warning {
      color: var(--mat-sys-error);
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      // Room for the display font ascenders, which the scrollable content would clip.
      padding-top: 8px;
    }

    .subject {
      margin: 0;
      font-family: var(--app-font-display);
      font-size: 2rem;
      line-height: 1.25;
      letter-spacing: 0.04em;
      color: var(--mat-sys-on-surface);
      text-shadow: 2px 2px 0 var(--app-accent);
    }

    .message {
      margin: 0;
      line-height: 1.5;
    }

    .actions {
      padding-top: 16px;
    }

    .danger {
      --mat-button-filled-container-color: var(--mat-sys-error);
      --mat-button-filled-label-text-color: var(--mat-sys-on-error);
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
