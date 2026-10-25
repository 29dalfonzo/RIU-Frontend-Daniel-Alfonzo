import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  const open = vi.fn();
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
