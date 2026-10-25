import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroAvatarComponent, heroInitials } from './hero-avatar.component';

describe('heroInitials', () => {
  it('uses the first letter of the first two words', () => {
    expect(heroInitials('WONDER WOMAN')).toBe('WW');
    expect(heroInitials('MANOLITO EL FUERTE')).toBe('ME');
  });

  it('uses the first two letters of a single word', () => {
    expect(heroInitials('BATMAN')).toBe('BA');
  });

  it('treats hyphens as word separators', () => {
    expect(heroInitials('SHE-HULK')).toBe('SH');
  });

  it('handles blank names', () => {
    expect(heroInitials('   ')).toBe('?');
  });
});

describe('HeroAvatarComponent', () => {
  let fixture: ComponentFixture<HeroAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroAvatarComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeroAvatarComponent);
    fixture.componentRef.setInput('name', 'IRON MAN');
    fixture.componentRef.setInput('publisher', 'Marvel');
    await fixture.whenStable();
  });

  it('shows the initials and is hidden from assistive technology', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent?.trim()).toBe('IM');
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('is colored by publisher', async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('publisher-marvel');

    fixture.componentRef.setInput('publisher', 'DC');
    await fixture.whenStable();

    expect(host.classList).toContain('publisher-dc');
    expect(host.classList).not.toContain('publisher-marvel');
  });
});
