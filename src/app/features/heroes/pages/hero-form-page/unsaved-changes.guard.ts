import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/** Asks before leaving a page that still has unsaved edits. */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) =>
  !component.hasUnsavedChanges() ||
  inject(ConfirmDialogService).confirm({
    title: 'Discard changes?',
    message: 'You have unsaved changes. If you leave now, they will be lost.',
    confirmLabel: 'Discard',
    danger: true,
  });
