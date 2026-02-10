import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function SamePassword(passwordField: string): ValidatorFn {
  return (control: AbstractControl) => {
    const password = control.parent?.get(passwordField)?.value;
    const repeatPassword = control.value;
    return password === repeatPassword ? null : { passwordMismatch: true };
  };
}

export function StrongPassword(control: AbstractControl<string>): ValidationErrors | null {
  const MIN_LENGTH = 8;
  const SPECIAL_CHARS = ['!', '@', '#', '$', '%', '^', '&', '*', '.', '_', '(', ')', '+', '=', '-'];
  const value = control.value;
  if (!value) {
    return null;
  }
  const hasRequiredLength = value.length >= MIN_LENGTH;
  const hasUpperCase = /[A-Z]+/.test(value);
  const hasLowerCase = /[a-z]+/.test(value);
  const hasNumeric = /[0-9]+/.test(value);
  const hasSpecialChars = Array.from(value).some((char) => SPECIAL_CHARS.includes(char));
  const passwordValid = hasRequiredLength && hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChars;
  return passwordValid ? null : { strongPassword: true };
}
