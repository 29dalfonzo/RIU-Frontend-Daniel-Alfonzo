import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { UppercaseDirective } from './uppercase.directive';

@Component({
  imports: [ReactiveFormsModule, UppercaseDirective],
  template: `
    <input data-testid="bound" appUppercase [formControl]="name" />
    <input data-testid="plain" appUppercase />
  `,
})
class HostComponent {
  readonly name = new FormControl('', { nonNullable: true });
}

describe('UppercaseDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  const input = (testId: string): HTMLInputElement =>
    (fixture.nativeElement as HTMLElement).querySelector(
      `[data-testid="${testId}"]`,
    ) as HTMLInputElement;

  const type = (element: HTMLInputElement, value: string, caret = value.length): void => {
    element.value = value;
    element.setSelectionRange(caret, caret);
    element.dispatchEvent(new Event('input'));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
  });

  it('shows the typed text in upper case and stores it in the form control', () => {
    type(input('bound'), 'spider man');

    expect(input('bound').value).toBe('SPIDER MAN');
    expect(fixture.componentInstance.name.value).toBe('SPIDER MAN');
  });

  it('keeps the caret where the user was typing', () => {
    type(input('bound'), 'SPIDxER', 4);

    expect(input('bound').value).toBe('SPIDXER');
    expect(input('bound').selectionStart).toBe(4);
  });

  it('works on inputs without a form control', () => {
    type(input('plain'), 'flash');

    expect(input('plain').value).toBe('FLASH');
  });
});
