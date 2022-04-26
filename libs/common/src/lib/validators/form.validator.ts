import { AbstractControl, ValidatorFn } from '@angular/forms';
import { STFUtils } from '@flaps/core';

export function SamePassword(passwordField: string): ValidatorFn {
  return (control: AbstractControl) => {
    let password = control.parent?.get(passwordField)?.value;
    let repeatPassword = control.value;
    return password === repeatPassword ? null : { passwordMismatch: true }  
  }
}

export function Sluggable(): ValidatorFn {
  return (control: AbstractControl) => {
    const validSlug = STFUtils.generateSlug(control.value).length > 0;
    return validSlug ? null : { sluggable: true }  
  }
}