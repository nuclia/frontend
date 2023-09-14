import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Account, KnowledgeBox } from '@nuclia/core';
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

  private readonly kbSubject = new BehaviorSubject<KnowledgeBox | null>(null);
  readonly kb = this.kbSubject.asObservable();

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
      this.kbSubject.next(null);
    }
  }

  cleanAccount() {
    this.accountSubject.next(null);
    this.kbSubject.next(null);
  }

  getKb(): KnowledgeBox | null {
    return this.kbSubject.getValue();
  }

  setKb(stash: KnowledgeBox) {
    this.kbSubject.next(stash);
  }
}
