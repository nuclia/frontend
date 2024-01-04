import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { STFUtils } from '@flaps/core';

export function Sluggable(): ValidatorFn {
  return (control: AbstractControl) => {
    const validSlug = STFUtils.generateSlug(control.value).length > 0;
    return validSlug ? null : { sluggable: true };
  };
}

export function JsonValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value) {
      try {
        JSON.parse(control.value);
        return null;
      } catch (e) {
        return {
          invalidFormat: 'resource.extra-metadata.invalid-json',
        };
      }
    }
    return null;
  };
}

export function noDuplicateListItemsValidator(separator: string, error: string): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const list = control.value
      .split(separator)
      .map((item) => item.trim())
      .filter((item) => !!item);
    return list.some((item, index) => list.lastIndexOf(item) !== index) ? { duplicate: error } : null;
  };
}
