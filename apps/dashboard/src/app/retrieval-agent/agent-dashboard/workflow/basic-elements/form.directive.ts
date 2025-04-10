import { Directive, output } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Directive({})
export abstract class FormDirective {
  abstract form: FormGroup;
  abstract submit(): void;

  submitForm = output<unknown>();
}
