import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

import { NotificationComponent, NotificationData } from './notification.component';

describe('NotificationComponent', () => {
  let fixture: ComponentFixture<NotificationComponent>;
  const ref = { dismiss: vi.fn(), dismissWithAction: vi.fn() };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const render = async (data: NotificationData): Promise<void> => {
    ref.dismiss.mockReset();
    ref.dismissWithAction.mockReset();
    await TestBed.configureTestingModule({
      imports: [NotificationComponent],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: data },
        { provide: MatSnackBarRef, useValue: ref },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationComponent);
    await fixture.whenStable();
  };

  it.each([
    ['success', 'check'],
    ['info', 'bolt'],
    ['error', 'priority_high'],
  ] as const)('shows the %s icon next to the message', async (kind, icon) => {
    await render({ message: 'BATMAN was updated', kind });

    expect(element().querySelector('.message')?.textContent?.trim()).toBe('BATMAN was updated');
    expect(element().querySelector('.icon')?.textContent?.trim()).toBe(icon);
  });

  it('runs the action and closes', async () => {
    await render({ message: 'SUPERMAN was deleted', kind: 'info', actionLabel: 'Undo' });

    element().querySelector<HTMLButtonElement>('[data-testid="notification-action"]')?.click();

    expect(ref.dismissWithAction).toHaveBeenCalled();
  });

  it('can be dismissed without running the action', async () => {
    await render({ message: 'SUPERMAN was deleted', kind: 'info', actionLabel: 'Undo' });

    element().querySelector<HTMLButtonElement>('button[aria-label="Dismiss"]')?.click();

    expect(ref.dismiss).toHaveBeenCalled();
    expect(ref.dismissWithAction).not.toHaveBeenCalled();
  });

  it('has no action button when there is no action', async () => {
    await render({ message: 'Saved', kind: 'success' });

    expect(element().querySelector('[data-testid="notification-action"]')).toBeNull();
  });
});
