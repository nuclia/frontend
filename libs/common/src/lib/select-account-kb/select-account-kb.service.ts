import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { SDKService } from '@flaps/core';
import { Account, IKnowledgeBoxItem } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class SelectAccountKbService {
  private readonly accountsSubject = new BehaviorSubject<Account[] | null>(null);
  private readonly kbsSubject = new BehaviorSubject<IKnowledgeBoxItem[] | null>(null);

  readonly accounts = this.accountsSubject.asObservable();
  readonly kbs = this.kbsSubject.asObservable();

  constructor(private sdk: SDKService) {}

  loadAccounts(): Observable<Account[]> {
    return this.sdk.nuclia.db.getAccounts().pipe(tap((accounts) => this.accountsSubject.next(accounts)));
  }

  loadKbs(accountSlug: string): Observable<IKnowledgeBoxItem[]> {
    return this.sdk.nuclia.db.getKnowledgeBoxes(accountSlug).pipe(tap((kbs) => this.kbsSubject.next(kbs)));
  }

  selectAccount(accountSlug: string) {
    return this.sdk.setCurrentAccount(accountSlug);
  }
}
