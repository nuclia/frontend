import { Injectable } from '@angular/core';
import { Router, Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AccountService } from '../services/account.service';
import { ManagerStash } from '../models/stash.model';

@Injectable()
export class StashResolve implements Resolve<ManagerStash | null> {
  constructor(private accountService: AccountService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<ManagerStash | null> {
    const accountId = route.parent?.paramMap.get('account');
    const stashId = route.paramMap.get('stash');
    if (accountId && stashId) {
      return this.accountService.getStash(accountId, stashId);
    } else {
      return of(null);
    }
  }
}
