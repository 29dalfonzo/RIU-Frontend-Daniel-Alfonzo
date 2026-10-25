import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, takeUntil } from 'rxjs';

const DURATION_MS = 3000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Close', { duration: DURATION_MS, politeness: 'polite' });
  }

  /** Shows a message with an action button; emits when it is clicked, completes on dismiss. */
  action(message: string, actionLabel: string): Observable<void> {
    const ref = this.snackBar.open(message, actionLabel, {
      duration: DURATION_MS * 2,
      politeness: 'polite',
    });
    return ref.onAction().pipe(takeUntil(ref.afterDismissed()));
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: DURATION_MS * 2,
      politeness: 'assertive',
      panelClass: 'app-snackbar-error',
    });
  }
}
