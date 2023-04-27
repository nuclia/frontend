import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, Observable, take } from 'rxjs';
import { ExtendedAccount, KbSummary, ZoneSummary } from '../account.models';
import { AccountBlockingState } from '@nuclia/core';

const BLOCKING_STATE_LABEL = {
  [AccountBlockingState.UNBLOCKED]: 'Active',
  [AccountBlockingState.QUOTA]: 'Blocked due to quota',
  [AccountBlockingState.MANAGER]: 'Blocked by manager',
};

@Injectable({ providedIn: 'root' })
export class AccountDetailsStore {
  private _accountDetails: BehaviorSubject<ExtendedAccount | null> = new BehaviorSubject<ExtendedAccount | null>(null);
  private _kbDetails: BehaviorSubject<KbSummary | null> = new BehaviorSubject<KbSummary | null>(null);
  private _zones: BehaviorSubject<ZoneSummary[]> = new BehaviorSubject<ZoneSummary[]>([]);
  private _currentState: BehaviorSubject<string> = new BehaviorSubject<string>('');

  accountDetails = this._accountDetails.asObservable();
  kbDetails = this._kbDetails.asObservable();
  zones = this._zones.asObservable();
  currentState = this._currentState.asObservable();

  setAccountDetails(account: ExtendedAccount) {
    this._accountDetails.next(account);
    this._currentState.next(BLOCKING_STATE_LABEL[account.blocking_state]);
  }

  setZones(zones: ZoneSummary[]) {
    this._zones.next(zones);
  }

  setKbDetails(kb: KbSummary) {
    this._kbDetails.next(kb);
  }

  getAccount(): Observable<ExtendedAccount> {
    return this.accountDetails.pipe(
      filter((account) => !!account),
      map((account) => account as ExtendedAccount),
      take(1),
    );
  }

  getKb(): Observable<KbSummary> {
    return this.kbDetails.pipe(
      filter((kb) => !!kb),
      map((kb) => kb as KbSummary),
      take(1),
    );
  }

  resetAccountDetails() {
    this._accountDetails.next(null);
  }
}
