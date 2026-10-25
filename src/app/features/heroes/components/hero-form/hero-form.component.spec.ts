import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';

import { HERO_FIXTURES } from '../../testing/hero.fixtures';
import { HeroFormComponent } from './hero-form.component';

describe('HeroFormComponent', () => {
  let fixture: ComponentFixture<HeroFormComponent>;
  let loader: HarnessLoader;
  const saved = vi.fn();
  const cancelled = vi.fn();

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const field = (name: string): HTMLInputElement =>
    element().querySelector(`input[formControlName="${name}"]`) as HTMLInputElement;
  const errors = (): string[] =>
    Array.from(element().querySelectorAll('mat-error'), (error) => error.textContent?.trim() ?? '');
  const type = (name: string, value: string): void => {
    field(name).value = value;
    field(name).dispatchEvent(new Event('input'));
  };
  const submit = async (): Promise<void> => {
    element().querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const fillValidHero = async (): Promise<void> => {
    type('name', 'thor');
    type('realName', 'Thor Odinson');
    type('firstAppearance', '1962');
    await (await loader.getHarness(MatSelectHarness)).clickOptions({ text: 'Marvel' });
  };

  beforeEach(async () => {
    saved.mockReset();
    cancelled.mockReset();
    await TestBed.configureTestingModule({ imports: [HeroFormComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeroFormComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.componentInstance.save.subscribe(saved);
    fixture.componentInstance.cancelled.subscribe(cancelled);
    await fixture.whenStable();
  });

  it('starts empty when there is no hero', async () => {
    expect(field('name').value).toBe('');
    expect(field('realName').value).toBe('');
    expect(field('firstAppearance').value).toBe('');
    expect(await (await loader.getHarness(MatSelectHarness)).getValueText()).toBe('');
  });

  it('shows the required errors and does not save an empty form', async () => {
    await submit();

    expect(errors()).toEqual([
      'Name is required',
      'Real name is required',
      'Publisher is required',
      'First appearance is required',
    ]);
    expect(saved).not.toHaveBeenCalled();
  });

  it('validates the name length and the first appearance year', async () => {
    type('name', 'x');
    type('firstAppearance', '1800');
    await submit();

    expect(errors()).toContain('Name must have at least 2 characters');
    expect(errors()).toContain(`Year must be between 1900 and ${new Date().getFullYear()}`);
  });

  it('emits the new hero when the form is valid', async () => {
    await fillValidHero();
    await submit();

    expect(saved).toHaveBeenCalledWith({
      name: 'THOR',
      realName: 'Thor Odinson',
      publisher: 'Marvel',
      firstAppearance: 1962,
    });
  });

  it('is pre-filled with the hero to edit and emits its changes', async () => {
    fixture.componentRef.setInput('hero', HERO_FIXTURES[3]);
    await fixture.whenStable();

    expect(field('name').value).toBe('BATMAN');
    expect(field('realName').value).toBe('Bruce Wayne');
    expect(field('firstAppearance').value).toBe('1939');
    expect(await (await loader.getHarness(MatSelectHarness)).getValueText()).toBe('DC');

    type('realName', 'Dick Grayson');
    await submit();

    expect(saved).toHaveBeenCalledWith({
      name: 'BATMAN',
      realName: 'Dick Grayson',
      publisher: 'DC',
      firstAppearance: 1939,
    });
  });

  it('disables saving while busy', async () => {
    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();

    const button = element().querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(button?.disabled).toBe(true);
  });

  it('focuses the first invalid field when saving fails', async () => {
    type('name', 'thor');
    await submit();

    expect(document.activeElement).toBe(field('realName'));
  });

  it('explains each field with a hint and counts the name characters', async () => {
    type('name', 'flash');
    await fixture.whenStable();

    const hints = Array.from(element().querySelectorAll('mat-hint'), (hint) =>
      hint.textContent?.trim(),
    );
    expect(hints).toEqual(
      expect.arrayContaining(['Shown in upper case and unique', '5/40', 'Secret identity']),
    );
  });

  it('previews the hero while the user types', async () => {
    type('name', 'storm');
    type('realName', 'Ororo Munroe');
    await fixture.whenStable();

    const preview = element().querySelector('app-hero-preview');
    expect(preview?.textContent).toContain('STORM');
    expect(preview?.textContent).toContain('Ororo Munroe');
  });

  describe('change tracking', () => {
    const saveButton = (): HTMLButtonElement =>
      element().querySelector('button[type="submit"]') as HTMLButtonElement;

    beforeEach(async () => {
      fixture.componentRef.setInput('hero', HERO_FIXTURES[3]);
      await fixture.whenStable();
    });

    it('only allows saving an edit once something changed', async () => {
      expect(saveButton().disabled).toBe(true);

      type('realName', 'Dick Grayson');
      await fixture.whenStable();

      expect(saveButton().disabled).toBe(false);
    });

    it('reports unsaved changes, and none after reverting them', async () => {
      const changes = vi.fn();
      fixture.componentInstance.changed.subscribe(changes);

      type('realName', 'Dick Grayson');
      await fixture.whenStable();
      expect(changes).toHaveBeenLastCalledWith(true);

      type('realName', 'Bruce Wayne');
      await fixture.whenStable();
      expect(changes).toHaveBeenLastCalledWith(false);
      expect(saveButton().disabled).toBe(true);
    });
  });

  it('emits cancelled', () => {
    element().querySelector<HTMLButtonElement>('[data-testid="cancel"]')?.click();

    expect(cancelled).toHaveBeenCalled();
  });
});
