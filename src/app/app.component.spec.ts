import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject } from 'rxjs';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { LoadingService } from './core/loading/loading.service';
import { ThemeService } from './core/theme/theme.service';
import { HERO_INITIAL_STATE, HERO_LATENCY_MS } from './features/heroes/data-access/hero.service';
import { SEARCH_DEBOUNCE_MS } from './features/heroes/pages/hero-list-page/hero-list-page.component';
import { HERO_FIXTURES, settle } from './features/heroes/testing/hero.fixtures';

describe('AppComponent routing', () => {
  let harness: RouterTestingHarness;

  const text = (): string => (harness.routeNativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        { provide: HERO_INITIAL_STATE, useValue: HERO_FIXTURES },
        { provide: HERO_LATENCY_MS, useValue: 0 },
        { provide: SEARCH_DEBOUNCE_MS, useValue: 0 },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('renders the toolbar with a link to the hero list', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const brand = (fixture.nativeElement as HTMLElement).querySelector('a.brand');
    expect(brand?.textContent).toContain('Hero Registry');
    expect(brand?.getAttribute('href')).toBe('/heroes');
  });

  it('switches between light and dark theme from the toolbar', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const theme = TestBed.inject(ThemeService);
    theme.theme.set('light');
    await fixture.whenStable();
    const toggle = (): HTMLButtonElement =>
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="theme-toggle"]',
      ) as HTMLButtonElement;

    expect(toggle().getAttribute('aria-label')).toBe('Switch to dark theme');

    toggle().click();
    await fixture.whenStable();

    expect(theme.theme()).toBe('dark');
    expect(toggle().getAttribute('aria-label')).toBe('Switch to light theme');
  });

  it('shows the loading bar only while an operation is in flight', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const operation = new Subject<void>();
    const loadingBar = (): Element | null =>
      (fixture.nativeElement as HTMLElement).querySelector('[data-testid="loading"]');
    await fixture.whenStable();
    expect(loadingBar()).toBeNull();

    operation.pipe(TestBed.inject(LoadingService).track()).subscribe();
    await fixture.whenStable();
    expect(loadingBar()).not.toBeNull();

    operation.complete();
    await fixture.whenStable();
    expect(loadingBar()).toBeNull();
  });

  it('redirects the root path to the hero list', async () => {
    await harness.navigateByUrl('/');
    await settle(harness.fixture);

    expect(text()).toContain('Super heroes');
    expect(text()).toContain('SPIDERMAN');
  });

  it('opens the empty form on /heroes/new', async () => {
    await harness.navigateByUrl('/heroes/new');
    await settle(harness.fixture);

    expect(text()).toContain('New hero');
  });

  it('binds the route id to the edit form', async () => {
    await harness.navigateByUrl('/heroes/4/edit');
    await settle(harness.fixture);

    expect(text()).toContain('Edit BATMAN');
  });

  it('redirects unknown paths to the hero list', async () => {
    await harness.navigateByUrl('/villains');
    await settle(harness.fixture);

    expect(text()).toContain('Super heroes');
  });
});
