import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublisherBadgeComponent } from './publisher-badge.component';

describe('PublisherBadgeComponent', () => {
  let fixture: ComponentFixture<PublisherBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublisherBadgeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PublisherBadgeComponent);
  });

  it.each([
    ['Marvel', 'publisher-marvel'],
    ['DC', 'publisher-dc'],
    ['Other', 'publisher-other'],
  ] as const)('shows %s with its own color', async (publisher, cssClass) => {
    fixture.componentRef.setInput('publisher', publisher);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent?.trim()).toBe(publisher);
    expect(host.classList).toContain(cssClass);
  });
});
