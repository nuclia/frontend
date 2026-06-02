import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Currency } from '@flaps/core';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private _initialCurrency = new BehaviorSubject<Currency>('USD');
  initialCurrency = this._initialCurrency.asObservable();

  setInitialCurrency(currency: Currency) {
    this._initialCurrency.next(currency);
  }
}
