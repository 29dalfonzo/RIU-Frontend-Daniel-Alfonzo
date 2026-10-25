import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { ConfirmDialogService } from '../../../../shared/ui/confirm-dialog/confirm-dialog.service';
import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { HeroListQueryService } from '../../data-access/hero-list-query.service';
import { HERO_INITIAL_STATE, HERO_LATENCY_MS, HeroService } from '../../data-access/hero.service';
import { HERO_FIXTURES, settle } from '../../testing/hero.fixtures';
import { HeroListPageComponent, SEARCH_DEBOUNCE_MS } from './hero-list-page.component';

@Component({ template: 'form' })
class FormStubComponent {}

describe('HeroListPageComponent', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  const confirm = vi.fn();
  const notifications = { success: vi.fn(), error: vi.fn() };

  const element = (): HTMLElement => harness.routeNativeElement as HTMLElement;
  const renderedNames = (): string[] =>
    Array.from(
      element().querySelectorAll('[data-testid="hero-name"]'),
      (cell) => cell.textContent?.trim() ?? '',
    );
  const click = async (selector: string): Promise<void> => {
    element().querySelector<HTMLElement>(selector)?.click();
    await settle(harness.fixture);
  };
  const open = async (url: string): Promise<void> => {
    await harness.navigateByUrl(url);
    await settle(harness.fixture);
  };
  const search = async (term: string): Promise<void> => {
    const input = element().querySelector<HTMLInputElement>(
      'app-hero-search input',
    ) as HTMLInputElement;
    input.value = term;
    input.dispatchEvent(new Event('input'));
    await settle(harness.fixture);
  };

  beforeEach(async () => {
    confirm.mockReset();
    notifications.success.mockReset();
    notifications.error.mockReset();

    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'heroes', component: HeroListPageComponent },
            { path: 'heroes/new', component: FormStubComponent },
            { path: 'heroes/:id/edit', component: FormStubComponent },
          ],
          withComponentInputBinding(),
        ),
        { provide: HERO_INITIAL_STATE, useValue: HERO_FIXTURES },
        { provide: HERO_LATENCY_MS, useValue: 0 },
        { provide: SEARCH_DEBOUNCE_MS, useValue: 0 },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: NotificationService, useValue: notifications },
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    await open('/heroes');
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

  describe('URL state', () => {
    it('filters by the typed name and keeps the term in the URL', async () => {
      await search('iron');

      expect(renderedNames()).toEqual(['IRON MAN']);
      expect(router.url).toBe('/heroes?q=iron');
    });

    it('restores the filter, page and sort from the URL', async () => {
      await open('/heroes?q=man&page=2&sort=name:asc');

      expect(renderedNames()).toEqual(['WONDER WOMAN']);
      expect(element().querySelector<HTMLInputElement>('app-hero-search input')?.value).toBe('man');
    });

    it('goes back to the first page when the filter changes', async () => {
      await open('/heroes?page=2');

      await search('man');

      expect(router.url).toBe('/heroes?q=man');
      expect(renderedNames()[0]).toBe('SPIDERMAN');
    });

    it('stores the page and page size in the URL', async () => {
      await click('.mat-mdc-paginator-navigation-next');

      expect(router.url).toBe('/heroes?page=2');
      expect(renderedNames()).toEqual(['IRON MAN', 'THOR']);
    });

    it('stores the sort in the URL', async () => {
      await click('th[mat-sort-header="name"] .mat-sort-header-container');

      expect(router.url).toBe('/heroes?sort=name:asc');
      expect(renderedNames()[0]).toBe('BATMAN');
    });

    it('falls back to the last available page for an out of range page', async () => {
      await open('/heroes?page=9');

      expect(renderedNames()).toEqual(['IRON MAN', 'THOR']);
    });

    it('ignores invalid page and size values', async () => {
      await open('/heroes?page=abc&size=7');

      expect(renderedNames()).toHaveLength(5);
      expect(renderedNames()[0]).toBe('SPIDERMAN');
    });

    it('remembers the list query so forms can return to it', async () => {
      await open('/heroes?q=man&page=2');

      expect(TestBed.inject(HeroListQueryService).lastQuery()).toEqual({ q: 'man', page: '2' });
    });
  });

  describe('feedback', () => {
    it('shows a loading skeleton until the first results arrive', async () => {
      await open('/heroes/new');
      await harness.navigateByUrl('/heroes?q=bat');
      harness.fixture.detectChanges();

      expect(element().querySelector('[data-testid="list-skeleton"]')).not.toBeNull();

      await settle(harness.fixture);

      expect(element().querySelector('[data-testid="list-skeleton"]')).toBeNull();
      expect(renderedNames()).toEqual(['BATMAN']);
    });

    it('shows how many heroes are registered and announces filtered results', async () => {
      expect(element().querySelector('[data-testid="hero-count"]')?.textContent?.trim()).toBe(
        '7 heroes',
      );

      await search('man');

      const announcer = element().querySelector('[data-testid="results-announcer"]');
      expect(announcer?.textContent?.trim()).toBe('6 heroes found');
    });

    it('offers to clear the filter when nothing matches', async () => {
      await search('xyz');

      const empty = element().querySelector('[data-testid="empty-state"]');
      expect(empty?.textContent).toContain('No heroes match "xyz"');

      await click('[data-testid="clear-filter"]');

      expect(router.url).toBe('/heroes');
      expect(renderedNames()).toHaveLength(5);
    });

    it('highlights the hero the user just saved, on its page', async () => {
      // Coming back from a form, as HeroFormPageComponent does after saving.
      await open('/heroes/new');
      await router.navigate(['/heroes'], { state: { highlightId: 7 } });
      await settle(harness.fixture);

      expect(router.url).toBe('/heroes?page=2');
      const highlighted = element().querySelector('tr.highlighted [data-testid="hero-name"]');
      expect(highlighted?.textContent?.trim()).toBe('THOR');
    });

    it('focuses the search box when the user presses "/"', async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
      await settle(harness.fixture);

      expect(document.activeElement).toBe(element().querySelector('app-hero-search input'));
    });

    it('does not steal "/" while the user is typing in a field', async () => {
      const input = element().querySelector('app-hero-search input') as HTMLInputElement;
      const typing = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });

      input.dispatchEvent(typing);

      expect(typing.defaultPrevented).toBe(false);
    });
  });

  it('navigates to the empty form when adding a hero', async () => {
    await click('[data-testid="add-hero"]');

    expect(router.url).toBe('/heroes/new');
  });

  it('navigates to the edit form of the selected hero', async () => {
    await click('button[aria-label="Edit BATMAN"]');

    expect(router.url).toBe('/heroes/4/edit');
  });

  describe('delete', () => {
    it('deletes the hero after the user confirms', async () => {
      confirm.mockReturnValue(of(true));

      await click('button[aria-label="Delete SUPERMAN"]');

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('SUPERMAN') }),
      );
      expect(renderedNames()).not.toContain('SUPERMAN');
      expect(notifications.success).toHaveBeenCalledWith('SUPERMAN was deleted');
    });

    it('keeps the hero when the user cancels', async () => {
      confirm.mockReturnValue(of(false));

      await click('button[aria-label="Delete SUPERMAN"]');

      expect(renderedNames()).toContain('SUPERMAN');
      expect(notifications.success).not.toHaveBeenCalled();
    });

    it('keeps the active filter after deleting', async () => {
      confirm.mockReturnValue(of(true));
      await search('man');

      await click('button[aria-label="Delete BATMAN"]');

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
      await click('button[aria-label="Delete SUPERMAN"]');

      expect(notifications.error).toHaveBeenCalledWith('Hero with id 2 was not found');
    });
  });
});
