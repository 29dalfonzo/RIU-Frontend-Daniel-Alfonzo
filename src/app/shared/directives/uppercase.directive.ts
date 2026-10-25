import { Directive, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Upper-cases what the user types. Unlike `text-transform: uppercase`, it changes the real value,
 * so the form model and the persisted data match what is shown.
 */
@Directive({
  selector: 'input[appUppercase]',
  host: { '(input)': 'onInput()' },
})
export class UppercaseDirective {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  protected onInput(): void {
    const upper = this.input.value.toUpperCase();
    if (upper === this.input.value) {
      return;
    }

    const { selectionStart, selectionEnd } = this.input;
    this.input.value = upper;
    this.input.setSelectionRange(selectionStart, selectionEnd);
    this.ngControl?.control?.setValue(upper, { emitModelToViewChange: false });
  }
}
