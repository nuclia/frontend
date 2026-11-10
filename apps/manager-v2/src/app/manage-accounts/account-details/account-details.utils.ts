import { computed, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { of, startWith, switchMap } from 'rxjs';

export const UNLIMITED = -1;

export type LimitMode = 'limit' | 'unlimited';

export function toLimitMode(limit: number): LimitMode {
  return limit === UNLIMITED ? 'unlimited' : 'limit';
}

export function getOptionLabel<T extends string>(options: readonly { value: T; label: string }[], value: T): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function controlValue<T>(control: () => AbstractControl<T> | null | undefined): Signal<T | undefined> {
  return toSignal(
    toObservable(computed(control)).pipe(
      switchMap((currentControl) =>
        currentControl ? currentControl.valueChanges.pipe(startWith(currentControl.value)) : of(undefined),
      ),
    ),
  );
}
