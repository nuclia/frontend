import { Injectable } from '@angular/core';
import { Account } from '../models/account.model';
import { Router, Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AccountService } from '../services/account.service';

@Injectable()
export class AccountResolve implements Resolve<Account | null> {
  constructor(private accountService: AccountService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Account | null> {
    const accountId = route.paramMap.get('account');
    if (accountId) {
      return this.accountService.getAccount(accountId);
    } else {
      return of(null);
    }
  }
}
