import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
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
    expect(brand?.textContent).toContain('Super Heroes');
    expect(brand?.getAttribute('href')).toBe('/heroes');
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
