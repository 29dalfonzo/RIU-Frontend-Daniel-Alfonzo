import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';

import { Hero } from '../../models/hero.model';
import { HERO_FIXTURES } from '../../testing/hero.fixtures';
import { HeroTableComponent } from './hero-table.component';

describe('HeroTableComponent', () => {
  let fixture: ComponentFixture<HeroTableComponent>;
  let loader: HarnessLoader;

  const renderedNames = (): string[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '[data-testid="hero-name"]',
      ),
      (cell) => cell.textContent?.trim() ?? '',
    );

  const setHeroes = async (heroes: readonly Hero[]): Promise<void> => {
    fixture.componentRef.setInput('heroes', heroes);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeroTableComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await setHeroes(HERO_FIXTURES);
  });

  it('shows the first page of heroes', () => {
    expect(renderedNames()).toEqual([
      'SPIDERMAN',
      'SUPERMAN',
      'MANOLITO EL FUERTE',
      'BATMAN',
      'WONDER WOMAN',
    ]);
  });

  it('moves to the next page through the paginator', async () => {
    const paginator = await loader.getHarness(MatPaginatorHarness);

    await paginator.goToNextPage();

    expect(renderedNames()).toEqual(['IRON MAN', 'THOR']);
    expect(await paginator.getRangeLabel()).toBe('6 – 7 of 7');
  });

  it('changes the page size', async () => {
    const paginator = await loader.getHarness(MatPaginatorHarness);

    await paginator.setPageSize(10);

    expect(renderedNames()).toHaveLength(7);
  });

  it('keeps the user on the last valid page when the list shrinks', async () => {
    const paginator = await loader.getHarness(MatPaginatorHarness);
    await paginator.goToNextPage();

    await setHeroes(HERO_FIXTURES.slice(0, 5));

    expect(renderedNames()).toEqual([
      'SPIDERMAN',
      'SUPERMAN',
      'MANOLITO EL FUERTE',
      'BATMAN',
      'WONDER WOMAN',
    ]);
  });

  it('emits the hero to edit', () => {
    const edited = vi.fn();
    fixture.componentInstance.edit.subscribe(edited);

    clickAction('Edit BATMAN');

    expect(edited).toHaveBeenCalledWith(HERO_FIXTURES[3]);
  });

  it('emits the hero to remove', () => {
    const removed = vi.fn();
    fixture.componentInstance.remove.subscribe(removed);

    clickAction('Delete SUPERMAN');

    expect(removed).toHaveBeenCalledWith(HERO_FIXTURES[1]);
  });

  it('shows an empty state when there are no heroes', async () => {
    await setHeroes([]);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[data-testid="empty-state"]')?.textContent).toContain(
      'No heroes found',
    );
    expect(renderedNames()).toEqual([]);
  });

  function clickAction(label: string): void {
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`,
    );
    expect(button).not.toBeNull();
    button?.click();
  }
});
