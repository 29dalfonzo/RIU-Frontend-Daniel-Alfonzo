import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { NotificationService } from '../../../../shared/ui/notification/notification.service';
import { HeroListQueryService } from '../../data-access/hero-list-query.service';
import { HERO_INITIAL_STATE, HERO_LATENCY_MS, HeroService } from '../../data-access/hero.service';
import { HERO_FIXTURES, settle } from '../../testing/hero.fixtures';
import { HeroFormPageComponent } from './hero-form-page.component';

/** The list view the user came from: forms must return to it, not to a reset list. */
const LIST_QUERY = { q: 'man', page: '2' };

describe('HeroFormPageComponent', () => {
  let fixture: ComponentFixture<HeroFormPageComponent>;
  let router: Router;
  let heroService: HeroService;
  const notifications = { success: vi.fn(), error: vi.fn() };

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const field = (name: string): HTMLInputElement =>
    element().querySelector(`input[formControlName="${name}"]`) as HTMLInputElement;
  const type = (name: string, value: string): void => {
    field(name).value = value;
    field(name).dispatchEvent(new Event('input'));
  };
  const submit = async (): Promise<void> => {
    element().querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };

  const fillForm = async (
    hero: Record<'name' | 'realName' | 'firstAppearance' | 'publisher', string>,
  ) => {
    type('name', hero.name);
    type('realName', hero.realName);
    type('firstAppearance', hero.firstAppearance);
    const publisher = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness);
    await publisher.clickOptions({ text: hero.publisher });
  };

  const render = async (id?: string): Promise<void> => {
    fixture = TestBed.createComponent(HeroFormPageComponent);
    if (id !== undefined) {
      fixture.componentRef.setInput('id', id);
    }
    await settle(fixture);
  };

  beforeEach(async () => {
    notifications.success.mockReset();
    notifications.error.mockReset();

    await TestBed.configureTestingModule({
      imports: [HeroFormPageComponent],
      providers: [
        provideRouter([]),
        { provide: HERO_INITIAL_STATE, useValue: HERO_FIXTURES },
        { provide: HERO_LATENCY_MS, useValue: 0 },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    heroService = TestBed.inject(HeroService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    TestBed.inject(HeroListQueryService).remember(LIST_QUERY);
  });

  describe('create mode', () => {
    beforeEach(() => render());

    it('shows an empty form', () => {
      expect(element().querySelector('h1')?.textContent).toContain('New hero');
      expect(field('name').value).toBe('');
    });

    it('registers the hero and returns to the list', async () => {
      await fillForm({
        name: 'hulk',
        realName: 'Bruce Banner',
        publisher: 'Marvel',
        firstAppearance: '1962',
      });
      await submit();

      const heroes = await firstValueFrom(heroService.searchByName('hulk'));
      expect(heroes).toEqual([
        {
          id: 8,
          name: 'HULK',
          realName: 'Bruce Banner',
          publisher: 'Marvel',
          firstAppearance: 1962,
        },
      ]);
      // The list announces the result: it knows whether the hero is on screen.
      expect(notifications.success).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/heroes'], {
        queryParams: LIST_QUERY,
        state: { savedHero: { id: 8, message: 'HULK was created' } },
      });
    });

    it('stays on the form when the name is already taken', async () => {
      await fillForm({
        name: 'batman',
        realName: 'Someone',
        publisher: 'DC',
        firstAppearance: '2000',
      });
      await submit();

      expect(notifications.error).toHaveBeenCalledWith('A hero named "BATMAN" already exists');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('returns to the list on cancel', () => {
      element().querySelector<HTMLButtonElement>('[data-testid="cancel"]')?.click();

      expect(router.navigate).toHaveBeenCalledWith(['/heroes'], { queryParams: LIST_QUERY });
    });
  });

  describe('navigation safety', () => {
    it('shows a breadcrumb back to the list view the user came from', async () => {
      await render('4');

      const crumb = element().querySelector<HTMLAnchorElement>('nav[aria-label="Breadcrumb"] a');
      expect(crumb?.textContent?.trim()).toBe('Heroes');
      expect(crumb?.getAttribute('href')).toBe('/heroes?q=man&page=2');
      expect(element().querySelector('[aria-current="page"]')?.textContent?.trim()).toBe(
        'Edit BATMAN',
      );
    });

    it('reports unsaved changes only while the form differs from the saved hero', async () => {
      await render('4');
      const page = fixture.componentInstance;
      expect(page.hasUnsavedChanges()).toBe(false);

      type('realName', 'Dick Grayson');
      await settle(fixture);
      expect(page.hasUnsavedChanges()).toBe(true);

      await submit();
      expect(page.hasUnsavedChanges()).toBe(false);
    });
  });

  describe('edit mode', () => {
    it('loads the selected hero, saves the changes and returns to the list', async () => {
      await render('4');

      expect(element().querySelector('h1')?.textContent).toContain('Edit BATMAN');
      expect(field('name').value).toBe('BATMAN');

      type('realName', 'Dick Grayson');
      await submit();

      expect(await firstValueFrom(heroService.getById(4))).toEqual({
        ...HERO_FIXTURES[3],
        realName: 'Dick Grayson',
      });
      expect(notifications.success).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/heroes'], {
        queryParams: LIST_QUERY,
        state: { savedHero: { id: 4, message: 'BATMAN was updated' } },
      });
    });

    it('returns to the list when the hero does not exist', async () => {
      await render('99');

      expect(notifications.error).toHaveBeenCalledWith('Hero with id 99 was not found');
      expect(router.navigate).toHaveBeenCalledWith(['/heroes'], { queryParams: LIST_QUERY });
      expect(element().querySelector('form')).toBeNull();
    });
  });
});
