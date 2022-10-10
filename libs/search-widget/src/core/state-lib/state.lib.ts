import { BehaviorSubject, map, Observable } from 'rxjs';

export interface SvelteWritableObservable<U, V = U> extends Observable<U> {
  set(value: V): void;
}

export class SvelteState<STATE> {
  store: BehaviorSubject<STATE>;

  constructor(value: STATE) {
    this.store = new BehaviorSubject(value);
  }

  reader<U>(selectFn: (state: STATE) => U): Observable<U> {
    return this.store.asObservable().pipe(map(selectFn));
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
}
