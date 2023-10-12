import { inject, Injectable } from '@angular/core';
import { GlobalAccountService } from './global-account.service';
import { AccountLimitsPatchPayload, AccountTypes } from '@nuclia/core';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { AccountTypeDefaults } from '@flaps/core';
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

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private globalService = inject(GlobalAccountService);
  private store = inject(ManagerStore);

  getDefaultLimits(accountType: AccountTypes): Observable<AccountTypeDefaults> {
    return this.globalService.getDefaultLimits(accountType);
  }

  /**
   * Get account list
   */
  getAccounts(): Observable<AccountSummary[]> {
    return this.globalService
      .getAccounts()
      .pipe(
        map((accounts) => accounts.map((summary) => this.globalService.mapAccountSummaryToAccountSummaryUI(summary))),
      );
  }

  /**
   * Get account details and set `AccountDetails` and `KbList` in store.
   */
  loadAccountDetails(accountId: string): Observable<AccountDetails> {
    return this.globalService.getAccount(accountId).pipe(
      map((extendedAccount) => {
        const accountDetails = this.globalService.mapExtendedToDetails(extendedAccount);
        this.store.setAccountDetails(accountDetails);
        this.store.setKbList(this.globalService.mapExtendedToKbList(extendedAccount));
        this.store.setBlockedFeatures(extendedAccount.blocked_features);
        return accountDetails;
      }),
    );
  }

  /**
   * Load counters for all the KB listed
   */
  loadKbCounters(accountId: string, kbList: KbSummary[]): Observable<KbCounters> {
    return this.globalService.loadKbCounters(accountId, kbList);
  }

  /**
   * Update account configuration and update the store accordingly
   */
  updateAccount(accountId: string, data: AccountConfigurationPayload): Observable<AccountDetails> {
    return this.globalService.updateAccount(accountId, data).pipe(switchMap(() => this.loadAccountDetails(accountId)));
  }

  /**
   * Update account limits and update the store accordingly
   */
  updateAccountLimits(accountId: string, limits: AccountLimitsPatchPayload): Observable<AccountDetails> {
    return this.globalService
      .updateAccountLimits(accountId, limits)
      .pipe(switchMap(() => this.loadAccountDetails(accountId)));
  }

  /**
   * Update blocked features of an account and update the store accordingly
   */
  updateBlockedFeatures(accountId: string, formValue: BlockedFeatureFormValues): Observable<AccountDetails> {
    return this.globalService
      .updateBlockedFeatures(accountId, formValue)
      .pipe(switchMap(() => this.loadAccountDetails(accountId)));
  }

  /**
   * Load KB details
   */
  loadKb(accountId: string, kbId: string): Observable<KbDetails> {
    return this.globalService.getKb(accountId, kbId).pipe(
      map((kbSummary) => {
        const kbDetails = this.globalService.mapKbSummaryToDetails(kbSummary);
        this.store.setKbDetails(kbDetails);
        return kbDetails;
      }),
    );
  }

  /**
   * Update KB slug and/or title and update the store accordingly
   */
  updateKb(accountId: string, kbId: string, data: { slug?: string; title?: string }): Observable<KbDetails> {
    return this.globalService.updateKb(accountId, kbId, data).pipe(
      switchMap(() =>
        // load Account Details to update the kb list on the navigation panel
        forkJoin([this.loadAccountDetails(accountId), this.loadKb(accountId, kbId)]).pipe(
          map(([, kbDetails]) => kbDetails),
        ),
      ),
    );
  }

  /**
   * Add user to a KB and update the store accordingly
   */
  addKbUser(accountId: string, kbId: string, userId: string): Observable<KbDetails> {
    return this.globalService.addKbUser(accountId, kbId, userId).pipe(switchMap(() => this.loadKb(accountId, kbId)));
  }

  /**
   * Update user role on a KB and update the store accordingly
   */
  updateKbUser(accountId: string, kbId: string, userId: string, newRole: KbRoles): Observable<KbDetails> {
    return this.globalService
      .updateKbUser(accountId, kbId, userId, newRole)
      .pipe(switchMap(() => this.loadKb(accountId, kbId)));
  }

  /**
   * Remove user from a KB and update the store accordingly
   */
  removeKbUser(accountId: string, kbId: string, userId: string): Observable<KbDetails> {
    return this.globalService.removeKbUser(accountId, kbId, userId).pipe(switchMap(() => this.loadKb(accountId, kbId)));
  }

  /**
   * Load account users and add them to the store
   */
  loadAccountUsers(accountId: string): Observable<AccountUser[]> {
    return this.globalService.getAccount(accountId).pipe(
      map((extendedAccount) => {
        const accountUsers = this.globalService.mapExtendedAccountToUsers(extendedAccount);
        this.store.setAccountUsers(accountUsers);
        return accountUsers;
      }),
    );
  }

  /**
   * Add user to the account
   */
  addAccountUser(accountId: string, userId: string): Observable<AccountUser[]> {
    return this.globalService.addAccountUser(accountId, userId).pipe(switchMap(() => this.loadAccountUsers(accountId)));
  }

  /**
   * Remove user from the account
   */
  removeAccountUser(accountId: string, userId: string): Observable<AccountUser[]> {
    return this.globalService
      .removeAccountUser(accountId, userId)
      .pipe(switchMap(() => this.loadAccountUsers(accountId)));
  }

  /**
   * Update account user type
   */
  updateAccountUserType(accountId: string, userId: string, newType: AccountUserType): Observable<AccountUser[]> {
    return this.globalService
      .updateAccountUserType(accountId, userId, newType)
      .pipe(switchMap(() => this.loadAccountUsers(accountId)));
  }

  /**
   * Delete account
   */
  deleteAccount(accountId: string): Observable<void> {
    return this.globalService.deleteAccount(accountId);
  }
}
