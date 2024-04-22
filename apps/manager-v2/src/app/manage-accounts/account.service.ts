import { inject, Injectable } from '@angular/core';
import { GlobalAccountService } from './global-account.service';
import { AccountLimitsPatchPayload, AccountTypes, NucliaTokensMetric } from '@nuclia/core';
import { forkJoin, map, Observable, of, shareReplay, switchMap, take, tap, throwError } from 'rxjs';
import { AccountService as CoreAccountService, AccountTypeDefaults, SDKService } from '@flaps/core';
import { AccountUserType, KbRoles } from './global-account.models';
import {
  AccountConfigurationPayload,
  AccountDetails,
  AccountSummary,
  AccountUser,
  BlockedFeatureFormValues,
  KbCounters,
  KbDetails,
  KbSummary,
} from './account-ui.models';
import { ManagerStore } from '../manager.store';
import { RegionalAccountService } from './regional-account.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private sdk = inject(SDKService);
  private coreAccountService = inject(CoreAccountService);
  private globalService = inject(GlobalAccountService);
  private regionalService = inject(RegionalAccountService);
  private store = inject(ManagerStore);

  private _accountTypes = this.coreAccountService.getAccountTypes().pipe(shareReplay());

  getDefaultLimits(accountType: AccountTypes): Observable<AccountTypeDefaults> {
    return this._accountTypes.pipe(map((accountTypes) => accountTypes[accountType]));
  }

  /**
   * Get account list.
   * Same endpoint for both systems.
   */
  getAccounts(): Observable<AccountSummary[]> {
    return this.sdk.nuclia.rest.get<AccountSummary[]>('/manage/@accounts');
  }

  /**
   * Get account details and set `AccountDetails` and `KbList` in store.
   */
  loadAccountDetails(accountId: string): Observable<AccountDetails> {
    return this.regionalService.getAccount(accountId).pipe(
      switchMap((account) => {
        const accountDetails = this.regionalService.mapAccountToDetails(account);
        this.store.setAccountDetails(accountDetails);
        this.store.setBlockedFeatures(account.blocked_features);
        return this.regionalService.getKbList(account.slug).pipe(
          map((kbList) => {
            this.store.setKbList(kbList);
            return accountDetails;
          }),
        );
      }),
    );
  }

  /**
   * Load counters for all the KB listed
   */
  loadKbCounters(kbList: KbSummary[]): Observable<KbCounters> {
    return this.regionalService.loadKbCounters(kbList);
  }

  /**
   * Update account configuration and update the store accordingly
   * Stays global
   */
  updateAccount(accountId: string, data: AccountConfigurationPayload): Observable<AccountDetails> {
    return this.globalService.updateAccount(accountId, data).pipe(switchMap(() => this.loadAccountDetails(accountId)));
  }

  /**
   * Update account limits and update the store accordingly
   * Stays global
   */
  updateAccountLimits(accountId: string, limits: AccountLimitsPatchPayload): Observable<AccountDetails> {
    return this.globalService
      .updateAccountLimits(accountId, limits)
      .pipe(switchMap(() => this.loadAccountDetails(accountId)));
  }

  /**
   * Update blocked features of an account and update the store accordingly
   * Stays global
   */
  updateBlockedFeatures(accountId: string, formValue: BlockedFeatureFormValues): Observable<AccountDetails> {
    return this.globalService
      .updateBlockedFeatures(accountId, formValue)
      .pipe(switchMap(() => this.loadAccountDetails(accountId)));
  }

  /**
   * Load KB details
   */
  loadKb(kbSummary: KbSummary): Observable<KbDetails> {
    return this.store.accountDetails.pipe(
      switchMap((accountDetails) =>
        accountDetails ? of(accountDetails) : this.loadAccountDetails(kbSummary.accountId),
      ),
      switchMap((accountDetails) => this.regionalService.getKbDetails(kbSummary, accountDetails)),
      map((kbDetails) => {
        this.store.setKbDetails(kbDetails);
        return kbDetails;
      }),
    );
  }

  /**
   * Update KB slug and/or title and update the store accordingly
   */
  updateKb(kbSummary: KbSummary, data: { slug?: string; title?: string }): Observable<KbDetails> {
    return this.regionalService.updateKb(kbSummary, data).pipe(
      tap(() => console.log(`update kb done`)),
      switchMap(() =>
        // load Account Details to update the kb list on the navigation panel
        forkJoin([this.loadAccountDetails(kbSummary.accountId).pipe(take(1)), this.loadKb(kbSummary).pipe(take(1))]),
      ),
      map(([, kbDetails]) => kbDetails),
    );
  }

  /**
   * Add user to a KB and update the store accordingly
   */
  addKbUser(kbSummary: KbSummary, userId: string): Observable<KbDetails> {
    return this.regionalService
      .updateKbUsers(kbSummary, { add: [{ id: userId, role: 'SMEMBER' }], update: [], delete: [] })
      .pipe(switchMap(() => this.loadKb(kbSummary)));
  }

  /**
   * Update user role on a KB and update the store accordingly
   */
  updateKbUser(kbSummary: KbSummary, userId: string, newRole: KbRoles): Observable<KbDetails> {
    return this.regionalService
      .updateKbUsers(kbSummary, { add: [], update: [{ id: userId, role: newRole }], delete: [] })
      .pipe(switchMap(() => this.loadKb(kbSummary)));
  }

  /**
   * Remove user from a KB and update the store accordingly
   */
  removeKbUser(kbSummary: KbSummary, userId: string): Observable<KbDetails> {
    return this.regionalService
      .updateKbUsers(kbSummary, { add: [], update: [], delete: [userId] })
      .pipe(switchMap(() => this.loadKb(kbSummary)));
  }

  /**
   * Load account users and add them to the store
   */
  loadAccountUsers(accountId: string): Observable<AccountUser[]> {
    return this.regionalService.getAccount(accountId).pipe(
      map((account) => {
        const users = this.regionalService.mapExtendedAccountToUsers(account);
        this.store.setAccountUsers(users);
        return users;
      }),
    );
  }

  /**
   * Add user to the account
   * Stays global
   */
  addAccountUser(accountId: string, userId: string): Observable<AccountUser[]> {
    return this.globalService.addAccountUser(accountId, userId).pipe(switchMap(() => this.loadAccountUsers(accountId)));
  }

  /**
   * Remove user from the account
   * Stays global
   */
  removeAccountUser(accountId: string, userId: string): Observable<AccountUser[]> {
    return this.globalService
      .removeAccountUser(accountId, userId)
      .pipe(switchMap(() => this.loadAccountUsers(accountId)));
  }

  /**
   * Update account user type
   * Stays global
   */
  updateAccountUserType(accountId: string, userId: string, newType: AccountUserType): Observable<AccountUser[]> {
    return this.globalService
      .updateAccountUserType(accountId, userId, newType)
      .pipe(switchMap(() => this.loadAccountUsers(accountId)));
  }

  /**
   * Delete account
   * Stays global
   */
  deleteAccount(accountId: string): Observable<void> {
    return this.globalService.deleteAccount(accountId);
  }

  /**
   * Load Nuclia tokens consumption
   * @param accountId
   * @param from
   * @param to
   * @param kbId
   */
  loadTokenConsumption(
    accountId: string,
    from: string,
    to?: string,
    kbId?: string,
  ): Observable<NucliaTokensMetric | null> {
    return this.sdk.nuclia.db.getUsage(accountId, from, to, kbId).pipe(
      map((usage) => {
        if (usage.length === 0) {
          return null;
        }
        const nucliaTokensPoint = usage[0].metrics.find((metric) => metric.name === 'nuclia_tokens');
        if (!nucliaTokensPoint) {
          console.warn(`No nuclia_tokens found in the response`, usage);
          throwError(() => 'No nuclia_tokens found in the response');
        }
        return nucliaTokensPoint as NucliaTokensMetric;
      }),
    );
  }
}
