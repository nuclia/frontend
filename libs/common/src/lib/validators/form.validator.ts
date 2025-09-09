import { AbstractControl, ValidatorFn } from '@angular/forms';
import { isAfter, isBefore } from 'date-fns';

const forbiddenSlugPattern = new RegExp(/[^\w-_]+/g);
export function Sluggable(kbSlug = false): ValidatorFn {
  return (control: AbstractControl) => {
    const forbidden = forbiddenSlugPattern.test(control.value);
    return forbidden ? { sluggable: kbSlug ? 'kb.form.invalid-slug' : 'validation.invalid-slug' } : null;
  };
}

// This is the regexp used by the backend to validate zone’s slug (and probably other ones too)
const validSlugPattern = new RegExp(/^[.a-z0-9_-]+$/);
export function ValidSlug(): ValidatorFn {
  return (control: AbstractControl) => {
    const valid = control.value.match(validSlugPattern) !== null;
    return valid ? null : { invalid: 'validation.invalid-slug' };
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

export function DateAfter(after: string): ValidatorFn {
  return (control: AbstractControl) => {
    const date = control.getRawValue();
    return isBefore(date, after) ? { dateBefore: true } : null;
  };
}

export function DateBefore(before: string): ValidatorFn {
  return (control: AbstractControl) => {
    const date = control.getRawValue();
    return isAfter(date, before) ? { dateAfter: true } : null;
  };
}
