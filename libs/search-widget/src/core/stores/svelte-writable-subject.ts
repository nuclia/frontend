import { BehaviorSubject } from 'rxjs';

/**
 * SvelteWritableSubject is an extension of BehaviorSubject fulfilling Svelte [Writable Store contract](https://svelte.dev/docs#run-time-svelte-store-writable)
 */
export class SvelteWritableSubject<T> extends BehaviorSubject<T> {
  set(value: T) {
    super.next(value);
  }

  update(callback: (value: T) => T) {
    super.next(callback(super.value));
  }
}

export function writableSubject<T>(value: T): SvelteWritableSubject<T> {
  return new SvelteWritableSubject<T>(value);
}
