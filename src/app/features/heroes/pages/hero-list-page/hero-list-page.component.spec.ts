import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { HERO_INITIAL_STATE, HERO_LATENCY_MS, HeroService } from '../../data-access/hero.service';
import { HERO_FIXTURES, settle } from '../../testing/hero.fixtures';
import { HeroListPageComponent, SEARCH_DEBOUNCE_MS } from './hero-list-page.component';

describe('HeroListPageComponent', () => {
  let fixture: ComponentFixture<HeroListPageComponent>;
  let router: Router;
  const confirm = vi.fn();
  const notifications = { success: vi.fn(), error: vi.fn() };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const renderedNames = (): string[] =>
    Array.from(
      element().querySelectorAll('[data-testid="hero-name"]'),
      (cell) => cell.textContent?.trim() ?? '',
    );
  const click = (selector: string): void =>
    element().querySelector<HTMLButtonElement>(selector)?.click();
  const search = async (term: string): Promise<void> => {
    const input = element().querySelector<HTMLInputElement>(
      'app-hero-search input',
    ) as HTMLInputElement;
    input.value = term;
    input.dispatchEvent(new Event('input'));
    await settle(fixture);
  };

  beforeEach(async () => {
    confirm.mockReset();
    notifications.success.mockReset();
    notifications.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [HeroListPageComponent],
      providers: [
        provideRouter([]),
        { provide: HERO_INITIAL_STATE, useValue: HERO_FIXTURES },
        { provide: HERO_LATENCY_MS, useValue: 0 },
        { provide: SEARCH_DEBOUNCE_MS, useValue: 0 },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(HeroListPageComponent);
    await settle(fixture);
  });

  it('loads the paginated list of heroes', () => {
    expect(renderedNames()).toEqual([
      'SPIDERMAN',
      'SUPERMAN',
      'MANOLITO EL FUERTE',
      'BATMAN',
      'WONDER WOMAN',
    ]);
  });

  it('filters the list by the typed name', async () => {
    await search('man');

    expect(renderedNames()).toEqual([
      'SPIDERMAN',
      'SUPERMAN',
      'MANOLITO EL FUERTE',
      'BATMAN',
      'WONDER WOMAN',
    ]);

    await search('iron');

    expect(renderedNames()).toEqual(['IRON MAN']);
  });

  it('navigates to the empty form when adding a hero', () => {
    click('[data-testid="add-hero"]');

    expect(router.navigate).toHaveBeenCalledWith(['/heroes', 'new']);
  });

  it('navigates to the edit form of the selected hero', () => {
    click('button[aria-label="Edit BATMAN"]');

    expect(router.navigate).toHaveBeenCalledWith(['/heroes', 4, 'edit']);
  });

  it('deletes the hero after the user confirms', async () => {
    confirm.mockReturnValue(of(true));

    click('button[aria-label="Delete SUPERMAN"]');
    await settle(fixture);

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('SUPERMAN') }),
    );
    expect(renderedNames()).not.toContain('SUPERMAN');
    expect(notifications.success).toHaveBeenCalledWith('SUPERMAN was deleted');
  });

  it('keeps the hero when the user cancels', async () => {
    confirm.mockReturnValue(of(false));

    click('button[aria-label="Delete SUPERMAN"]');
    await settle(fixture);

    expect(renderedNames()).toContain('SUPERMAN');
    expect(notifications.success).not.toHaveBeenCalled();
  });

  it('keeps the active filter after deleting', async () => {
    confirm.mockReturnValue(of(true));
    await search('man');

    click('button[aria-label="Delete BATMAN"]');
    await settle(fixture);

    expect(renderedNames()).toEqual([
      'SPIDERMAN',
      'SUPERMAN',
      'MANOLITO EL FUERTE',
      'WONDER WOMAN',
      'IRON MAN',
    ]);
  });

  it('reports a failed deletion', async () => {
    confirm.mockReturnValue(of(true));
    const heroService = TestBed.inject(HeroService);
    await new Promise<void>((resolve) => heroService.delete(2).subscribe(() => resolve()));

    // The row is still rendered from the previous load, so the action targets a hero that no longer exists.
    click('button[aria-label="Delete SUPERMAN"]');
    await settle(fixture);

    expect(notifications.error).toHaveBeenCalledWith('Hero with id 2 was not found');
  });
});
