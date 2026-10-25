import { TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { Component } from '@angular/core';

import { ConfirmDialogService } from './confirm-dialog.service';

@Component({ template: '' })
class HostComponent {}

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;
  let loader: HarnessLoader;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    service = TestBed.inject(ConfirmDialogService);
  });

  const answer = async (label: string): Promise<boolean | undefined> => {
    let result: boolean | undefined;
    service
      .confirm({ title: 'Delete hero', message: 'Are you sure?', confirmLabel: 'Delete' })
      .subscribe((value) => (result = value));

    const dialog = await loader.getHarness(MatDialogHarness);
    expect(await dialog.getTitleText()).toBe('Delete hero');
    expect(await dialog.getContentText()).toBe('Are you sure?');
    const button = await dialog.getHarness(MatButtonHarness.with({ text: label }));
    await button.click();
    await new Promise((resolve) => setTimeout(resolve));

    return result;
  };

  it('resolves true when the user confirms', async () => {
    expect(await answer('Delete')).toBe(true);
  });

  it('emphasizes the subject and marks destructive actions', async () => {
    service
      .confirm({
        title: 'Delete hero',
        subject: 'SUPERMAN',
        message: 'This hero will leave the registry.',
        confirmLabel: 'Delete',
        danger: true,
      })
      .subscribe();

    const dialog = await loader.getHarness(MatDialogHarness);
    const host = await dialog.host();
    expect(await host.text()).toContain('SUPERMAN');
    const confirm = await dialog.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    expect(await (await confirm.host()).hasClass('danger')).toBe(true);
  });

  it('resolves false when the user cancels', async () => {
    expect(await answer('Cancel')).toBe(false);
  });
});
