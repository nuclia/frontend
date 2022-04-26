import { AbstractControl, ValidatorFn } from '@angular/forms';

export function validSlug(): ValidatorFn {
  return (control: AbstractControl) => {
    const slug = control.value;
    const regex = /[A-Z_&@-\s/\\]/;
    return regex.test(slug) ? { invalidCharacters: true } : null;
  }
}