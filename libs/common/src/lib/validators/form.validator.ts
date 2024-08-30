import { AbstractControl, ValidatorFn } from '@angular/forms';
import { isBefore } from 'date-fns';

const forbiddenSlugPattern = new RegExp(/[^\w-_]+/g);
export function Sluggable(kbSlug = false): ValidatorFn {
  return (control: AbstractControl) => {
    const forbidden = forbiddenSlugPattern.test(control.value);
    return forbidden ? { sluggable: kbSlug ? 'kb.form.invalid-slug' : 'validation.invalid-slug' } : null;
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
