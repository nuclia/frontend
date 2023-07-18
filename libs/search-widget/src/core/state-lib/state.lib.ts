import type { Observable } from 'rxjs';
import { BehaviorSubject, map } from 'rxjs';

export interface ReadableObservable<U> extends Observable<U> {
  getValue(): U;
}

export interface SvelteWritableObservable<U, V = U> extends ReadableObservable<U> {
  set(value: V): void;
}

export interface SvelteActionObservable extends ReadableObservable<void> {
  do(): void;
}

export class SvelteState<STATE> {
  store: BehaviorSubject<STATE>;

  private readonly initialState: STATE;

  constructor(value: STATE) {
    this.initialState = value;
    this.store = new BehaviorSubject(value);
  }

  reader<U>(selectFn: (state: STATE) => U): ReadableObservable<U> {
    const obs = this.store.asObservable().pipe(map(selectFn)) as ReadableObservable<U>;
    obs.getValue = () => selectFn(this.store.getValue());
    return obs;
  }

  writer<U, V = U>(
    selectFn: (state: STATE) => U,
    updateFn: (state: STATE, params: V) => STATE,
  ): SvelteWritableObservable<U, V> {
    const selector = this.reader(selectFn) as SvelteWritableObservable<U, V>;
    selector.set = (params: V) => {
      const current = this.store.getValue();
      this.store.next(updateFn(current, params));
    };
    return selector;
  }

  action(updateFn: (state: STATE) => STATE): SvelteActionObservable {
    const selector = this.reader(() => {}) as SvelteActionObservable;
    selector.do = () => {
      const current = this.store.getValue();
      this.store.next(updateFn(current));
    };
    return selector;
  }

  reset() {
    this.store.next(this.initialState);
  }
}
