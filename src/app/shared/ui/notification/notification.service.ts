import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DURATION_MS = 3000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Close', { duration: DURATION_MS, politeness: 'polite' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: DURATION_MS * 2,
      politeness: 'assertive',
      panelClass: 'app-snackbar-error',
    });
  }
}
