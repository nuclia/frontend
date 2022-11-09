import { Injectable } from '@angular/core';
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
import { BackendConfigurationService } from '../config';
import { StateService } from '../state.service';
import { FeatureFlagService } from '../analytics/feature-flag.service';

@Injectable({ providedIn: 'root' })
export class SDKService {
  DEMO_SLUG = '__demo';
  nuclia: Nuclia = new Nuclia({
    backend: this.config.getAPIURL(),
    client: this.config.staticConf.client,
  });

  private _currentKB = new ReplaySubject<WritableKnowledgeBox>(1);
  currentKb = this._currentKB.asObservable();

  counters = new ReplaySubject<Counters>(1);
  pendingRefresh = new BehaviorSubject(false);
  private _refreshCounter = new Subject<boolean>();
  refreshing = this._refreshCounter.asObservable();
  private _repetitiveRefreshCounter = new Subject<void>();

  private _isKbLoaded = false;
  get isKbLoaded() {
    return this._isKbLoaded;
  }

  constructor(
    private config: BackendConfigurationService,
    private stateService: StateService,
    private featureFlagService: FeatureFlagService,
  ) {
    combineLatest([this.stateService.stash, this.stateService.account])
      .pipe(
        filter(([kb, account]) => !!kb && !!kb.slug && !!account && !!account.slug),
        switchMap(([kb, account]) =>
          kb && kb.slug === this.DEMO_SLUG
            ? this.getDemoKb()
            : this.nuclia.db
                .getKnowledgeBox(account!.slug, kb!.slug!)
                .pipe(map((data) => new WritableKnowledgeBox(this.nuclia, account!.slug, data))),
        ),
        tap(() => (this._isKbLoaded = true)),
      )
      .subscribe((kb) => this._currentKB.next(kb));
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
    } else if (kbSlug === this.DEMO_SLUG) {
      return this.getDemoKb().pipe(
        tap((kb) => {
          this.nuclia.options.zone = 'europe-1';
          this.stateService.setStash(kb);
        }),
      );
    } else {
      return this.nuclia.db.getKnowledgeBox(accountSlug, kbSlug).pipe(
        switchMap((kb) => this.nuclia.rest.getZoneSlug(kb.zone).pipe(map((zoneSlug) => ({ kb, zoneSlug })))),
        map(({ kb, zoneSlug }) => {
          this.nuclia.options.zone = zoneSlug;
          this.stateService.setStash(kb);
          return kb;
        }),
      );
    }
  }

  getDemoKb(): Observable<WritableKnowledgeBox> {
    return this.featureFlagService.getFeatureFlag('demo-kb-id').pipe(
      map(
        (kbId) =>
          new WritableKnowledgeBox(this.nuclia, this.stateService.getAccount()?.slug || '', {
            id: kbId as string,
            zone: 'europe-1',
            slug: this.DEMO_SLUG,
            title: 'Demo',
          }),
      ),
    );
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
