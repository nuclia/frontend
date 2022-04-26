import { Injectable } from '@angular/core';
import { AccountSummary } from '../models/account.model';
import { Router, Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AccountService } from '../services/account.service';

@Injectable()
export class AccountsResolve implements Resolve<AccountSummary[]> {
  constructor(private accountService: AccountService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<AccountSummary[]> {
    return this.accountService.getAccounts();
  }
}
