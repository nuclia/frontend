import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AccountTypes } from '@nuclia/core';
import { Currency } from '@flaps/core';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private _initialCurrency = new BehaviorSubject<Currency>('USD');
  initialCurrency = this._initialCurrency.asObservable();

  constructor() {}

  setInitialCurrency(currency: Currency) {
    this._initialCurrency.next(currency);
  }
}
