import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AccountBlockingState, BlockedFeature } from '@nuclia/core';
import { AccountDetails, AccountUser, KbDetails, KbSummary } from './manage-accounts/account-ui.models';

const BLOCKING_STATE_LABEL = {
  [AccountBlockingState.UNBLOCKED]: 'Active',
  [AccountBlockingState.QUOTA]: 'Blocked due to quota',
  [AccountBlockingState.MANAGER]: 'Blocked by manager',
};

@Injectable({ providedIn: 'root' })
export class ManagerStore {
  private _accountDetails: BehaviorSubject<AccountDetails | null> = new BehaviorSubject<AccountDetails | null>(null);
  private _kbList: BehaviorSubject<KbSummary[]> = new BehaviorSubject<KbSummary[]>([]);
  private _kbDetails: BehaviorSubject<KbDetails | null> = new BehaviorSubject<KbDetails | null>(null);
  private _blockedFeatures: BehaviorSubject<BlockedFeature[]> = new BehaviorSubject<BlockedFeature[]>([]);
  private _currentState: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private _accountUsers: BehaviorSubject<AccountUser[]> = new BehaviorSubject<AccountUser[]>([]);

  accountDetails: Observable<AccountDetails | null> = this._accountDetails.asObservable();
  kbList: Observable<KbSummary[]> = this._kbList.asObservable();
  kbDetails: Observable<KbDetails | null> = this._kbDetails.asObservable();
  blockedFeatures: Observable<BlockedFeature[]> = this._blockedFeatures.asObservable();
  currentState: Observable<string> = this._currentState.asObservable();
  accountUsers: Observable<AccountUser[]> = this._accountUsers.asObservable();

  setAccountDetails(details: AccountDetails | null) {
    this._accountDetails.next(details);
    if (details?.blockingState) {
      this._currentState.next(BLOCKING_STATE_LABEL[details.blockingState]);
    }
  }
  setKbList(list: KbSummary[]) {
    this._kbList.next(list);
  }
  setKbDetails(details: KbDetails | null) {
    this._kbDetails.next(details);
  }
  setBlockedFeatures(features: BlockedFeature[]) {
    this._blockedFeatures.next(features);
  }
  setAccountUsers(users: AccountUser[]) {
    this._accountUsers.next(
      users.sort((a, b) => {
        if (a.isManager && !b.isManager) {
          return -1;
        } else if (!a.isManager && b.isManager) {
          return 1;
        } else {
          return a.name.localeCompare(b.name);
        }
      }),
    );
  }

  getAccountId(): string | undefined {
    return this._accountDetails.value?.id;
  }
}
