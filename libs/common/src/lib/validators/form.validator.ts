import { AbstractControl, ValidatorFn } from '@angular/forms';
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
