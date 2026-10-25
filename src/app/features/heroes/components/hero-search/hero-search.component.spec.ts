import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroSearchComponent } from './hero-search.component';

describe('HeroSearchComponent', () => {
  let fixture: ComponentFixture<HeroSearchComponent>;
  let input: HTMLInputElement;

  const query = <T extends Element>(selector: string): T | null =>
    (fixture.nativeElement as HTMLElement).querySelector<T>(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroSearchComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeroSearchComponent);
    await fixture.whenStable();
    input = query<HTMLInputElement>('input') as HTMLInputElement;
  });

  it('emits every typed value as the new term', () => {
    const changes = vi.fn();
    fixture.componentInstance.term.subscribe(changes);

    input.value = 'man';
    input.dispatchEvent(new Event('input'));

    expect(changes).toHaveBeenCalledWith('man');
    expect(fixture.componentInstance.term()).toBe('man');
  });

  it('reflects the term provided by the parent', async () => {
    fixture.componentRef.setInput('term', 'bat');
    await fixture.whenStable();

    expect(input.value).toBe('bat');
  });

  it('offers a clear button only when there is a term', async () => {
    expect(query('button[aria-label="Clear search"]')).toBeNull();

    fixture.componentRef.setInput('term', 'bat');
    await fixture.whenStable();
    query<HTMLButtonElement>('button[aria-label="Clear search"]')?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.term()).toBe('');
    expect(input.value).toBe('');
  });
});
