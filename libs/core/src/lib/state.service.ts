import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Account, KnowledgeBox } from '@nuclia/core';
import { LocalState } from './models';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  local = new LocalState();

  private readonly accountSubject = new BehaviorSubject<Account | null>(null);
  readonly account = this.accountSubject.asObservable();

  private readonly kbSubject = new BehaviorSubject<KnowledgeBox | null>(null);
  readonly kb = this.kbSubject.asObservable();

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
