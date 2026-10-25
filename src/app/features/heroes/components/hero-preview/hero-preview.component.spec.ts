import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroPreviewComponent } from './hero-preview.component';

describe('HeroPreviewComponent', () => {
  let fixture: ComponentFixture<HeroPreviewComponent>;

  const text = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroPreviewComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeroPreviewComponent);
  });

  it('shows the hero as it will look in the registry', async () => {
    fixture.componentRef.setInput('hero', {
      name: 'storm',
      realName: 'Ororo Munroe',
      publisher: 'Marvel',
      firstAppearance: 1975,
    });
    await fixture.whenStable();

    expect(text()).toContain('STORM');
    expect(text()).toContain('Ororo Munroe');
    expect(text()).toContain('Marvel');
    expect(text()).toContain('Since 1975');
  });

  it('uses placeholders for missing values', async () => {
    fixture.componentRef.setInput('hero', {
      name: '',
      realName: '',
      publisher: null,
      firstAppearance: null,
    });
    await fixture.whenStable();

    expect(text()).toContain('YOUR HERO');
    expect(text()).toContain('Secret identity');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-publisher-badge')).toBeNull();
  });
});
