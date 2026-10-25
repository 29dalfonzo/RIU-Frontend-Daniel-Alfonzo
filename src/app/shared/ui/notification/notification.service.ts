import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { Observable, takeUntil } from 'rxjs';

import {
  NotificationComponent,
  NotificationData,
  NotificationKind,
} from './notification.component';

const DURATION_MS = 3000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open({ message, kind: 'success' }, { duration: DURATION_MS, politeness: 'polite' });
  }

  /** Shows a message with an action button; emits when it is clicked, completes on dismiss. */
  action(message: string, actionLabel: string): Observable<void> {
    const ref = this.open(
      { message, kind: 'info', actionLabel },
      { duration: DURATION_MS * 2, politeness: 'polite' },
    );
    return ref.onAction().pipe(takeUntil(ref.afterDismissed()));
  }

  error(message: string): void {
    this.open({ message, kind: 'error' }, { duration: DURATION_MS * 2, politeness: 'assertive' });
  }

  private open(data: NotificationData, config: MatSnackBarConfig<NotificationData>) {
    const kind: NotificationKind = data.kind;
    return this.snackBar.openFromComponent(NotificationComponent, {
      ...config,
      data,
      panelClass: ['comic-snackbar', `comic-snackbar-${kind}`],
    });
  }
}
