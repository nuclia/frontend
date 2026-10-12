import { Inject, Injectable } from '@angular/core';
import { Account } from '@nuclia/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { SDKService } from '../api';
import { StaticEnvironmentConfiguration } from '../config';

@Injectable({
  providedIn: 'root',
})
export class SelectAccountKbService {
  private readonly accountsSubject = new BehaviorSubject<Account[] | null>(null);

  readonly accounts = this.accountsSubject.asObservable();

  constructor(
    private sdk: SDKService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  loadAccounts(): Observable<Account[]> {
    const loadAccountRequest: Observable<Account[]> = this.sdk.nuclia.db.getAccounts();
    return loadAccountRequest.pipe(tap((accounts) => this.accountsSubject.next(accounts)));
  }

  selectAccount(accountSlug: string) {
    return this.sdk.setCurrentAccount(accountSlug);
  }
}
