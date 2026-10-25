import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

import { NotificationComponent } from './notification.component';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const onAction = new Subject<void>();
  const afterDismissed = new Subject<unknown>();
  const openFromComponent = vi.fn(() => ({
    onAction: () => onAction.asObservable(),
    afterDismissed: () => afterDismissed.asObservable(),
  }));
  let service: NotificationService;

  beforeEach(() => {
    openFromComponent.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: { openFromComponent } }],
    });
    service = TestBed.inject(NotificationService);
  });

  it('shows success messages politely with the success style', () => {
    service.success('Saved');

    expect(openFromComponent).toHaveBeenCalledWith(
      NotificationComponent,
      expect.objectContaining({
        data: { message: 'Saved', kind: 'success' },
        politeness: 'polite',
        panelClass: ['comic-snackbar', 'comic-snackbar-success'],
      }),
    );
  });

  it('emits when the user clicks the action and completes on dismiss', () => {
    const clicked = vi.fn();
    const completed = vi.fn();

    service
      .action('SUPERMAN was deleted', 'Undo')
      .subscribe({ next: clicked, complete: completed });
    onAction.next();
    afterDismissed.next({});

    expect(openFromComponent).toHaveBeenCalledWith(
      NotificationComponent,
      expect.objectContaining({
        data: { message: 'SUPERMAN was deleted', kind: 'info', actionLabel: 'Undo' },
        politeness: 'polite',
        panelClass: ['comic-snackbar', 'comic-snackbar-info'],
      }),
    );
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalled();
  });

  it('shows error messages assertively and longer', () => {
    service.error('Boom');

    expect(openFromComponent).toHaveBeenCalledWith(
      NotificationComponent,
      expect.objectContaining({
        data: { message: 'Boom', kind: 'error' },
        politeness: 'assertive',
        duration: 6000,
        panelClass: ['comic-snackbar', 'comic-snackbar-error'],
      }),
    );
  });
});
