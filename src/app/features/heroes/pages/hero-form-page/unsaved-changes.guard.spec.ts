import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';

import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  const confirm = vi.fn();

  const run = (component: HasUnsavedChanges) =>
    TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component,
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  beforeEach(() => {
    confirm.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: ConfirmDialogService, useValue: { confirm } }],
    });
  });

  it('lets the user leave when there is nothing to lose', () => {
    expect(run({ hasUnsavedChanges: () => false })).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it.each([true, false])('asks before discarding changes (answer: %s)', async (answer) => {
    confirm.mockReturnValue(of(answer));

    const result = run({ hasUnsavedChanges: () => true }) as Observable<boolean>;

    expect(await firstValueFrom(result)).toBe(answer);
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Discard changes?', danger: true }),
    );
  });
});
