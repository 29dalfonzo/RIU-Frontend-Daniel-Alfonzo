import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
import { MatSortHarness } from '@angular/material/sort/testing';

import { HERO_FIXTURES } from '../../testing/hero.fixtures';
import { HeroTableComponent } from './hero-table.component';

describe('HeroTableComponent', () => {
  let fixture: ComponentFixture<HeroTableComponent>;
  let loader: HarnessLoader;

  const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const renderedNames = (): string[] =>
    Array.from(
      element().querySelectorAll<HTMLElement>('[data-testid="hero-name"]'),
      (cell) => cell.textContent?.trim() ?? '',
    );

  const setInputs = async (inputs: Record<string, unknown>): Promise<void> => {
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeroTableComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await setInputs({ heroes: HERO_FIXTURES, pageIndex: 0, pageSize: 5 });
  });

  it('shows the requested page of heroes', async () => {
    expect(renderedNames()).toEqual([
      'SPIDERMAN',
      'SUPERMAN',
      'MANOLITO EL FUERTE',
      'BATMAN',
      'WONDER WOMAN',
    ]);

    await setInputs({ pageIndex: 1 });

    expect(renderedNames()).toEqual(['IRON MAN', 'THOR']);
    expect(await (await loader.getHarness(MatPaginatorHarness)).getRangeLabel()).toBe('6 – 7 of 7');
  });

  it('emits page changes instead of changing the page itself', async () => {
    const pageChanges = vi.fn();
    fixture.componentInstance.pageChange.subscribe(pageChanges);
    const paginator = await loader.getHarness(MatPaginatorHarness);

    await paginator.goToNextPage();

    expect(pageChanges).toHaveBeenCalledWith(
      expect.objectContaining({ pageIndex: 1, pageSize: 5 }),
    );
  });

  it('emits the new sort when a column header is clicked', async () => {
    const sortChanges = vi.fn();
    fixture.componentInstance.sortChange.subscribe(sortChanges);
    const sort = await loader.getHarness(MatSortHarness);

    await (await sort.getSortHeaders({ label: 'Name' }))[0].click();

    expect(sortChanges).toHaveBeenLastCalledWith({ field: 'name', direction: 'asc' });
  });

  it('emits no sort when the sort is cleared', async () => {
    const sortChanges = vi.fn();
    fixture.componentInstance.sortChange.subscribe(sortChanges);
    await setInputs({ sort: { field: 'name', direction: 'desc' } });
    const sort = await loader.getHarness(MatSortHarness);

    await (await sort.getSortHeaders({ label: 'Name' }))[0].click();

    expect(sortChanges).toHaveBeenLastCalledWith(undefined);
  });

  it('reflects the active sort in the header', async () => {
    await setInputs({ sort: { field: 'firstAppearance', direction: 'desc' } });
    const sort = await loader.getHarness(MatSortHarness);

    const active = await sort.getActiveHeader();

    expect(await active?.getLabel()).toBe('First appearance');
    expect(await active?.getSortDirection()).toBe('desc');
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
    await setInputs({ heroes: [] });

    expect(element().querySelector('[data-testid="empty-state"]')?.textContent).toContain(
      'No heroes found',
    );
    expect(renderedNames()).toEqual([]);
  });

  function clickAction(label: string): void {
    const button = element().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    expect(button).not.toBeNull();
    button?.click();
  }
});
