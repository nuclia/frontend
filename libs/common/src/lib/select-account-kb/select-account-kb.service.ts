import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { SDKService, standaloneSimpleAccount, StaticEnvironmentConfiguration } from '@flaps/core';
import { Account } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class SelectAccountKbService {
  private readonly accountsSubject = new BehaviorSubject<Account[] | null>(null);

  readonly accounts = this.accountsSubject.asObservable();
  readonly standalone = this.environment.standalone;

  constructor(
    private sdk: SDKService,
    @Inject('staticEnvironmentConfiguration') private environment: StaticEnvironmentConfiguration,
  ) {}

  loadAccounts(): Observable<Account[]> {
    const loadAccountRequest: Observable<Account[]> = this.standalone
      ? of([standaloneSimpleAccount])
      : this.sdk.nuclia.db.getAccounts();
    return loadAccountRequest.pipe(tap((accounts) => this.accountsSubject.next(accounts)));
  }

  selectAccount(accountSlug: string) {
    return this.sdk.setCurrentAccount(accountSlug);
  }
}
