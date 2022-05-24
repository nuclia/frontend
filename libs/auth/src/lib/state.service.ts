import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { KnowledgeBox, Account } from '@nuclia/core';
import { LocalState } from './models';

const STATE_DATA = 'STATE_DATA';

export interface StateData {
  account: string;
  stash: string | null; // There are use cases were only an account is set
}

@Injectable({
  providedIn: 'root',
})
export class StateService {
  local = new LocalState();

  private readonly accountSubject = new BehaviorSubject<Account | null>(null);
  readonly account = this.accountSubject.asObservable();

  private readonly stashSubject = new BehaviorSubject<KnowledgeBox | null>(null);
  readonly stash = this.stashSubject.asObservable();

  dbGetStateData(): StateData | null {
    return this.local.getStoredState<StateData>(STATE_DATA);
  }

  dbSetStateData(data: StateData | null) {
    this.local.storeLocalState(STATE_DATA, data);
  }

  dbDelStateData() {
    this.local.removeStoredState(STATE_DATA);
  }

  getAccount(): Account | null {
    return this.accountSubject.getValue();
  }

  setAccount(account: Account, clean?: boolean) {
    this.accountSubject.next(account);
    if (clean) {
      this.stashSubject.next(null);
    }
  }

  cleanAccount() {
    this.accountSubject.next(null);
    this.stashSubject.next(null);
  }

  getStash(): KnowledgeBox | null {
    return this.stashSubject.getValue();
  }

  setStash(stash: KnowledgeBox) {
    this.stashSubject.next(stash);
  }

  cleanStash() {
    this.stashSubject.next(null);
  }
}
