import { DestroyRef, Directive, inject } from '@angular/core';
import { ControlValueAccessor, FormGroup, TouchedChangeEvent, ValidationErrors, Validator } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Directive()
export class SourceFormDirective implements ControlValueAccessor, Validator {
  private destroyRef = inject(DestroyRef);

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  form = new FormGroup<any>({});

  initForm() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.onChange(this.mapFormToValue(value)));
    this.form.events
      .pipe(
        filter((event) => event instanceof TouchedChangeEvent && event.touched),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.onTouched());
  }

  validate(): ValidationErrors | null {
    return this.form.valid ? null : { invalid: true };
  }

  writeValue(value: { [key: string]: any }) {
    this.form.patchValue(this.mapValueToForm(value || {}), { emitEvent: false });
  }
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  mapValueToForm(value: { [key: string]: any }): { [key: string]: any } {
    return value;
  }

  mapFormToValue(formValue: { [key: string]: any }): { [key: string]: any } {
    return formValue;
  }
}
