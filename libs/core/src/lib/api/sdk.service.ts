import { Injectable } from '@angular/core';
import {
  Account,
  Counters,
  IKnowledgeBoxItem,
  KBRoles,
  KnowledgeBox,
  Nuclia,
  WritableKnowledgeBox,
} from '@nuclia/core';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { BackendConfigurationService } from '../config';
import { take } from 'rxjs/operators';
import { standaloneSimpleAccount } from '../models/account.model';

@Injectable({ providedIn: 'root' })
export class SDKService {
  nuclia: Nuclia = new Nuclia({
    backend: this.config.getAPIURL(),
    client: this.config.staticConf.client,
    standalone: this.config.staticConf.standalone,
  });

  private _account = new BehaviorSubject<Account | null>(null);
  private _kb = new BehaviorSubject<KnowledgeBox | null>(null);
  private _currentKB = new ReplaySubject<WritableKnowledgeBox>(1);
  private _kbList = new ReplaySubject<IKnowledgeBoxItem[]>(1);
  private _refreshingKbList = new BehaviorSubject<boolean>(false);
  private _refreshCounter = new Subject<boolean>();
  private _triggerRefreshKbs = new Subject<boolean>();
  private _repetitiveRefreshCounter = new Subject<void>();
  private _isKbLoaded = false;

  currentKb = this._currentKB.asObservable();
  kbList: Observable<IKnowledgeBoxItem[]> = this._kbList.asObservable();
  refreshingKbList: Observable<boolean> = this._refreshingKbList.asObservable();
  currentAccount: Observable<Account> = this._account.pipe(
    filter((account) => !!account),
    map((account) => account as Account),
  );
  counters = new ReplaySubject<Counters>(1);
  pendingRefresh = new BehaviorSubject(false);
  refreshing = this._refreshCounter.asObservable();
  isAdminOrContrib = this.currentKb.pipe(map((kb) => this.nuclia.options.standalone || !!kb.admin || !!kb.contrib));

  useRegionalSystem = true;

  get isKbLoaded() {
    return this._isKbLoaded;
  }

  set kb(kb: KnowledgeBox | null) {
    this._kb.next(kb);
  }

  set account(account: Account | null) {
    this.nuclia.options.accountId = account?.id;
    this._account.next(account);
  }

  constructor(private config: BackendConfigurationService) {
    this._triggerRefreshKbs.subscribe((refreshCurrentKb) => this._refreshKbList(refreshCurrentKb));
    this.currentAccount.subscribe(() => this.refreshKbList());

    combineLatest([this._kb, this._account])
      .pipe(
        filter(([kb, account]) => !!kb && !!kb.slug && !!account && !!account.slug),
        map(([kb, account]) => [kb, account] as [KnowledgeBox, Account]),
        distinctUntilChanged(
          (previous, current) => previous[0].id === current[0].id && previous[0].slug === current[0].slug,
        ),
        switchMap(([kb, account]) =>
          this.nuclia.db
            .getKnowledgeBox(account.slug, (this.config.staticConf.standalone ? kb.id : kb.slug) as string)
            .pipe(map((data) => new WritableKnowledgeBox(this.nuclia, account.slug, data))),
        ),
        tap(() => (this._isKbLoaded = true)),
      )
      .subscribe((kb) => {
        this._currentKB.next(kb);
      });

    this.countersRefreshSubcriptions();
    this.refreshCounter(true);
  }

  cleanAccount() {
    this.account = null;
    this.kb = null;
  }

  setCurrentAccount(accountSlug: string): Observable<Account> {
    // returns the current account and set it if not set
    const currentAccount = this._account.value;
    if (currentAccount && currentAccount.slug === accountSlug) {
      return of(currentAccount);
    } else {
      const getAccount = this.config.staticConf.standalone
        ? of(standaloneSimpleAccount)
        : this.nuclia.db.getAccount(accountSlug);
      return getAccount.pipe(tap((account) => (this.account = account)));
    }
  }

  setCurrentKnowledgeBox(
    accountSlug: string,
    kbSlug: string,
    zone?: string,
    force = false,
  ): Observable<WritableKnowledgeBox> {
    // returns the current kb and set it if not set
    const currentKb = this._kb.value;
    if (!force && currentKb && currentKb.slug === kbSlug) {
      return of(currentKb as WritableKnowledgeBox);
    } else {
      this.nuclia.options.zone = zone;
      return this.nuclia.db.getKnowledgeBox(accountSlug, kbSlug).pipe(
        map((kb) => {
          this.kb = kb;
          return kb;
        }),
      );
    }
  }

  refreshCounter(singleTry = false): void {
    this._refreshCounter.next(true);
    if (!singleTry) {
      this._repetitiveRefreshCounter.next();
    }
  }

  refreshKbList(refreshCurrentKb = false) {
    this._triggerRefreshKbs.next(refreshCurrentKb);
  }

  private _refreshKbList(refreshCurrentKb = false) {
    this._refreshingKbList.next(true);
    const kbList: Observable<IKnowledgeBoxItem[]> = this.nuclia.options.standalone
      ? this.nuclia.db.getStandaloneKbs().pipe(
          map((kbs) =>
            kbs.map((kb) => ({
              id: kb.uuid,
              slug: kb.uuid,
              zone: 'local',
              title: kb.slug,
              role_on_kb: 'SOWNER' as KBRoles,
            })),
          ),
        )
      : this.currentAccount.pipe(
          take(1),
          switchMap((account) => this.nuclia.db.getKnowledgeBoxes(account.slug)),
        );

    kbList.subscribe({
      next: (list) => {
        this._kbList.next(list.sort((a, b) => (a.title || '').localeCompare(b.title || '')));
        this._refreshingKbList.next(false);
      },
      error: () => this._refreshingKbList.next(false),
    });

    if (refreshCurrentKb) {
      forkJoin([this.currentAccount.pipe(take(1)), this.currentKb.pipe(take(1))])
        .pipe(
          switchMap(([account, kb]) =>
            this.nuclia.db
              .getKnowledgeBox(
                account.slug || account.id,
                (this.config.staticConf.standalone ? kb.id : kb.slug) as string,
              )
              .pipe(map((data) => new WritableKnowledgeBox(this.nuclia, account.slug || account.id, data))),
          ),
        )
        .subscribe((kb) => this._currentKB.next(kb));
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
