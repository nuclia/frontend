import { Injectable } from '@angular/core';
import { BackendConfigurationService } from '@flaps/auth';
import { Account, Counters, Nuclia, WritableKnowledgeBox } from '@nuclia/core';
import {
  combineLatest,
  of,
  Observable,
  switchMap,
  tap,
  filter,
  map,
  Subject,
  takeUntil,
  delay,
  ReplaySubject,
  BehaviorSubject,
} from 'rxjs';
import { StateService } from './state.service';

@Injectable({ providedIn: 'root' })
export class SDKService {
  nuclia: Nuclia = new Nuclia({ backend: this.config.getAPIURL(), client: 'dashboard' });

  private _currentKB = new ReplaySubject<WritableKnowledgeBox>(1);
  currentKb = this._currentKB.asObservable();

  counters = new ReplaySubject<Counters>(1);
  pendingRefresh = new BehaviorSubject(false);
  private _refreshCounter = new Subject<boolean>();
  refreshing = this._refreshCounter.asObservable();
  private _repetitiveRefreshCounter = new Subject<void>();

  constructor(private config: BackendConfigurationService, private stateService: StateService) {
    combineLatest([this.stateService.stash, this.stateService.account])
      .pipe(
        filter(([kb, account]) => !!kb && !!kb.slug && !!account && !!account.slug),
        switchMap(([kb, account]) =>
          this.nuclia.db
            .getKnowledgeBox(account!.slug, kb!.slug!)
            .pipe(map((data) => new WritableKnowledgeBox(this.nuclia, account!.slug, data))),
        ),
      )
      .subscribe(this._currentKB);
    this.countersRefreshSubcriptions();
    this.refreshCounter(true);
  }

  setCurrentAccount(accountSlug: string): Observable<Account> {
    // returns the current account and set it if not set
    const currentAccount = this.stateService.getAccount();
    return currentAccount && currentAccount.slug === accountSlug
      ? of(currentAccount as Account)
      : this.nuclia.db.getAccount(accountSlug).pipe(tap((account) => this.stateService.setAccount(account)));
  }

  setCurrentKnowledgeBox(accountSlug: string, kbSlug: string, force = false): Observable<WritableKnowledgeBox> {
    // returns the current kb and set it if not set
    const currentKb = this.stateService.getStash();
    if (currentKb && currentKb.slug === kbSlug && !force) {
      return of(currentKb as WritableKnowledgeBox);
    } else {
      return this.nuclia.db.getKnowledgeBox(accountSlug, kbSlug).pipe(tap((kb) => this.stateService.setStash(kb)));
    }
  }

  refreshCounter(singleTry = false): void {
    this._refreshCounter.next(true);
    if (!singleTry) {
      this._repetitiveRefreshCounter.next();
    }
  }

  private countersRefreshSubcriptions() {
    this._refreshCounter
      .pipe(
        filter((refresh) => refresh),
        switchMap(() => this.currentKb),
        switchMap((kb) => kb.counters()),
        tap((counters) => this.counters.next(counters)),
      )
      .subscribe();

    this._repetitiveRefreshCounter
      .pipe(
        switchMap(() => {
          this.pendingRefresh.next(true);
          let currentTotal = -1;
          let retries = 0;
          return this.counters.pipe(
            delay(5000),
            tap((counters) => {
              if (currentTotal === -1) {
                currentTotal = counters.resources;
              }
              const keepPulling = retries < 15 && currentTotal === counters.resources;
              this._refreshCounter.next(keepPulling);
              if (!keepPulling) {
                this.pendingRefresh.next(false);
              }
              retries += 1;
            }),
            takeUntil(this._refreshCounter.pipe(filter((refresh) => !refresh))),
          );
        }),
      )
      .subscribe();
  }
}
