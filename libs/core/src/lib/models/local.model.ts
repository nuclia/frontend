import { EventEmitter, Output, Directive } from '@angular/core';
const STF_KEY = 'STF-';

@Directive()
export class LocalState {
  @Output() updated = new EventEmitter();

  getStoredState<T>(key: string): T | null {
    return JSON.parse(localStorage.getItem(STF_KEY + key) || 'null');
  }

  storeLocalState(key: string, state: any) {
    return localStorage.setItem(STF_KEY + key, JSON.stringify(state));
  }

  removeStoredState(key: string) {
    return localStorage.removeItem(STF_KEY + key);
  }
}

export interface LocalStateEvent {
  key: string;
  state: string;
}
