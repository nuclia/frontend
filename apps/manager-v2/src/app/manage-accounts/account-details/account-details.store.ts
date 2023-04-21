import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ExtendedAccount, ZoneSummary } from '../account.models';
import { AccountBlockingState } from '@nuclia/core';

const BLOCKING_STATE_LABEL = {
  [AccountBlockingState.UNBLOCKED]: 'Active',
  [AccountBlockingState.QUOTA]: 'Blocked due to quota',
  [AccountBlockingState.MANAGER]: 'Blocked by manager',
};

@Injectable({ providedIn: 'root' })
export class AccountDetailsStore {
  private _accountDetails: BehaviorSubject<ExtendedAccount | null> = new BehaviorSubject<ExtendedAccount | null>(null);
  private _zones: BehaviorSubject<ZoneSummary[]> = new BehaviorSubject<ZoneSummary[]>([]);
  private _currentState: BehaviorSubject<string> = new BehaviorSubject<string>('');

  accountDetails = this._accountDetails.asObservable();
  zones = this._zones.asObservable();
  currentState = this._currentState.asObservable();

  setAccountDetails(account: ExtendedAccount) {
    this._accountDetails.next(account);
    this._currentState.next(BLOCKING_STATE_LABEL[account.blocking_state]);
  }

  setZones(zones: ZoneSummary[]) {
    this._zones.next(zones);
  }

  resetAccountDetails() {
    this._accountDetails.next(null);
  }
}
