import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const onAction = new Subject<void>();
  const afterDismissed = new Subject<unknown>();
  const open = vi.fn(() => ({
    onAction: () => onAction.asObservable(),
    afterDismissed: () => afterDismissed.asObservable(),
  }));
  let service: NotificationService;

  beforeEach(() => {
    open.mockReset();
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { open } }] });
    service = TestBed.inject(NotificationService);
  });

  it('shows success messages politely', () => {
    service.success('Saved');

    expect(open).toHaveBeenCalledWith(
      'Saved',
      'Close',
      expect.objectContaining({ politeness: 'polite' }),
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

    expect(open).toHaveBeenCalledWith(
      'SUPERMAN was deleted',
      'Undo',
      expect.objectContaining({ politeness: 'polite' }),
    );
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalled();
  });

  it('shows error messages assertively and longer', () => {
    service.error('Boom');

    expect(open).toHaveBeenCalledWith(
      'Boom',
      'Close',
      expect.objectContaining({
        politeness: 'assertive',
        duration: 6000,
        panelClass: 'app-snackbar-error',
      }),
    );
  });
});
