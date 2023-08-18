import { AbstractControl, ValidatorFn } from '@angular/forms';

export function SamePassword(passwordField: string): ValidatorFn {
  return (control: AbstractControl) => {
    const password = control.parent?.get(passwordField)?.value;
    const repeatPassword = control.value;
    return password === repeatPassword ? null : { passwordMismatch: true };
  };
}
