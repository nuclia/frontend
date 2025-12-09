import { Injectable } from '@angular/core';
import {
  Account,
  Counters,
  IKnowledgeBoxItem,
  IRetrievalAgentItem,
  KBRoles,
  KnowledgeBox,
  Nuclia,
  RetrievalAgent,
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
  merge,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { take } from 'rxjs/operators';
import { BackendConfigurationService } from '../config';
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
  private _arag = new BehaviorSubject<RetrievalAgent | null>(null);
  private _currentKB = new ReplaySubject<WritableKnowledgeBox>(1);
  private _currentArag = new ReplaySubject<RetrievalAgent>(1);
  private _kbList = new ReplaySubject<IKnowledgeBoxItem[]>(1);
  private _aragList = new ReplaySubject<IRetrievalAgentItem[]>(1);
  private _aragListWithMemory = new ReplaySubject<IRetrievalAgentItem[]>(1);
  private _aragListNoMemory = new ReplaySubject<IRetrievalAgentItem[]>(1);
  private _refreshingKbList = new BehaviorSubject<boolean>(false);
  private _refreshingAragList = new BehaviorSubject<boolean>(false);
  private _refreshCounter = new Subject<boolean>();
  private _triggerRefreshKbs = new Subject<boolean>();
  private _triggerRefreshArags = new Subject<boolean>();
  private _repetitiveRefreshCounter = new Subject<void>();
  private _isKbLoaded = false;
  private _isAragLoaded = false;
  private _isArag = new Subject<boolean>();

  hasAccount = this._account.pipe(map((account) => account !== null));
  hasKb = this._kb.pipe(map((kb) => kb !== null));
  currentKb = this._currentKB.asObservable();
  currentArag = this._currentArag.asObservable();
  kbList: Observable<IKnowledgeBoxItem[]> = this._kbList.asObservable();
  refreshingKbList: Observable<boolean> = this._refreshingKbList.asObservable();
  aragList: Observable<IRetrievalAgentItem[]> = this._aragList.asObservable();
  aragListWithMemory: Observable<IRetrievalAgentItem[]> = this._aragListWithMemory.asObservable();
  aragListNoMemory: Observable<IRetrievalAgentItem[]> = this._aragListNoMemory.asObservable();
  refreshingAragList: Observable<boolean> = this._refreshingAragList.asObservable();
  currentAccount: Observable<Account> = this._account.pipe(
    filter((account) => !!account),
    map((account) => account as Account),
  );
  counters = new ReplaySubject<Counters | undefined>(1);
  pendingRefresh = new BehaviorSubject(false);
  isAdminOrContrib = merge(this.currentKb, this.currentArag).pipe(
    map((kb) => this.nuclia.options.standalone || !!kb.admin || !!kb.contrib),
  );
  isAragWithMemory = combineLatest([this._currentArag, this.aragListWithMemory]).pipe(
    map(([currentArag, withMemory]) => withMemory.some((arag) => arag.id === currentArag.id)),
  );

  get isKbLoaded() {
    return this._isKbLoaded;
  }
  get isAragLoaded() {
    return this._isAragLoaded;
  }

  set kb(kb: KnowledgeBox | null) {
    this._kb.next(kb);
  }
  set arag(arag: RetrievalAgent | null) {
    this._arag.next(arag);
  }
  get arag(): Observable<RetrievalAgent | null> {
    return this._arag.asObservable();
  }

  set account(account: Account | null) {
    this.nuclia.options.accountId = account?.id;
    this._account.next(account);
  }

  get isArag(): Observable<boolean> {
    return this._isArag.asObservable();
  }
  set isArag(isArag: boolean) {
    this._isArag.next(isArag);
  }

  constructor(private config: BackendConfigurationService) {
    this._triggerRefreshKbs.subscribe((refreshCurrentKb) => this._refreshKbList(refreshCurrentKb));
    this._triggerRefreshArags.subscribe((refreshCurrentRa) => this._refreshAragList(refreshCurrentRa));
    this.currentAccount.subscribe(() => {
      this.refreshKbList();
      this.refreshAragList();
    });

    combineLatest([this._kb, this._account])
      .pipe(
        distinctUntilChanged(
          ([previous], [current]) => previous?.id === current?.id && previous?.slug === current?.slug,
        ),
        filter(([kb, account]) => !!kb && !!kb.slug && !!account),
        map(([kb, account]) => [kb, account] as [KnowledgeBox, Account]),
        switchMap(([kb, account]) =>
          this.nuclia.db
            .getKnowledgeBox(account.id, kb.id, kb.zone)
            .pipe(map((data) => new WritableKnowledgeBox(this.nuclia, account.slug || account.id, data))),
        ),
        tap(() => (this._isKbLoaded = true)),
      )
      .subscribe((kb) => {
        this._currentKB.next(kb);
      });

    combineLatest([this._arag, this._account])
      .pipe(
        distinctUntilChanged(
          ([previous], [current]) => previous?.id === current?.id && previous?.slug === current?.slug,
        ),
        filter(([arag, account]) => !!arag && !!arag.slug && !!account),
        map(([arag, account]) => [arag, account] as [RetrievalAgent, Account]),
        switchMap(([arag, account]) =>
          this.nuclia.db
            .getRetrievalAgent(account.id, arag.id, arag.zone)
            .pipe(map((data) => new RetrievalAgent(this.nuclia, account.slug || account.id, data))),
        ),
        tap(() => (this._isAragLoaded = true)),
      )
      .subscribe((arag) => {
        this._currentArag.next(arag);
        this.kb = arag;
      });

    this.countersRefreshSubscriptions();
    this.refreshCounter(true);
  }

  cleanAccount() {
    this.account = null;
    this.kb = null;
    this.arag = null;
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

  setCurrentRetrievalAgent(
    accountId: string,
    aragId: string,
    zone?: string,
    force = false,
  ): Observable<RetrievalAgent> {
    // returns the current arag and set it if not set
    const currentRa = this._arag.value;
    if (!force && currentRa && currentRa.id === aragId) {
      return of(currentRa as RetrievalAgent);
    } else {
      this.nuclia.options.zone = zone;
      return this.nuclia.db.getRetrievalAgent(accountId, aragId, zone).pipe(
        map((arag) => {
          this.arag = arag;
          return arag;
        }),
      );
    }
  }

  setCurrentKnowledgeBox(
    accountId: string,
    kbId: string,
    zone?: string,
    force = false,
  ): Observable<WritableKnowledgeBox> {
    // returns the current kb and set it if not set
    const currentKb = this._kb.value;
    if (!force && currentKb && currentKb.id === kbId) {
      return of(currentKb as WritableKnowledgeBox);
    } else {
      this.nuclia.options.zone = zone;
      return this.nuclia.db.getKnowledgeBox(accountId, kbId, zone).pipe(
        map((kb) => {
          this.kb = kb;
          return kb;
        }),
      );
    }
  }

  setCurrentKnowledgeBoxFromSlug(accountSlug: string, kbSlug: string, zone?: string): Observable<WritableKnowledgeBox> {
    const currentKb = this._kb.value;
    const currentAccount = this._account.value;
    this.nuclia.options.zone = zone;
    if (currentKb && currentKb.slug === kbSlug) {
      return of(currentKb as WritableKnowledgeBox);
    } else if (zone) {
      return (currentAccount ? of(currentAccount) : this.setCurrentAccount(accountSlug)).pipe(
        switchMap((account) => {
          this.nuclia.options.accountId = account.id;
          return this.nuclia.db.getKnowledgeBoxesForZone(account.id, zone).pipe(
            switchMap((kbs) => {
              const kb = kbs.find((item) => item.slug === kbSlug);
              if (!kb) {
                return throwError(() => ({
                  status: 403,
                  message: `No KB found for ${kbSlug} in account ${accountSlug} on ${zone}.`,
                }));
              }
              this.nuclia.options.knowledgeBox = kb.id;
              return this.setCurrentKnowledgeBox(account.id, kb.id, zone);
            }),
          );
        }),
      );
    } else {
      return throwError(() => ({
        status: 403,
        message: `No KB found for ${kbSlug} in account ${accountSlug} on ${zone}.`,
      }));
    }
  }

  setCurrentRetrievalAgentFromSlug(accountSlug: string, agentSlug: string, zone?: string): Observable<RetrievalAgent> {
    const currentRa = this._arag.value;
    const currentAccount = this._account.value;
    this.nuclia.options.zone = zone;
    if (currentRa && currentRa.slug === agentSlug) {
      return of(currentRa as RetrievalAgent);
    } else if (zone) {
      return (currentAccount ? of(currentAccount) : this.setCurrentAccount(accountSlug)).pipe(
        switchMap((account) => {
          this.nuclia.options.accountId = account.id;
          return this.nuclia.db.getRetrievalAgentsForZone(account.id, zone).pipe(
            switchMap((arags) => {
              const arag = arags.find((item) => item.slug === agentSlug);
              if (!arag) {
                return throwError(() => ({
                  status: 403,
                  message: `No Retrieval Agent found for ${agentSlug} in account ${accountSlug} on ${zone}.`,
                }));
              }
              this.nuclia.options.knowledgeBox = arag.id;
              return this.setCurrentRetrievalAgent(account.id, arag.id, zone);
            }),
          );
        }),
      );
    } else {
      return throwError(() => ({
        status: 403,
        message: `No Retrieval Agent found for ${agentSlug} in account ${accountSlug} on ${zone}.`,
      }));
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

  refreshAragList(refreshCurrentArag = false) {
    this._triggerRefreshArags.next(refreshCurrentArag);
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
          switchMap((account) => this.nuclia.db.getKnowledgeBoxes(account.slug, account.id)),
        );

    kbList.subscribe({
      next: (list) => {
        this._kbList.next(list.sort((a, b) => (a.title || '').localeCompare(b.title || '')));
        this._refreshingKbList.next(false);
      },
      error: () => this._refreshingKbList.next(false),
    });

    if (refreshCurrentKb) {
      this.refreshCurrentKb().subscribe();
    }
  }

  private _refreshAragList(refreshCurrentRa = false) {
    this._refreshingAragList.next(true);
    this.currentAccount
      .pipe(
        take(1),
        switchMap((account) =>
          forkJoin([
            this.nuclia.db.getRetrievalAgents(account.slug, account.id, 'agent'),
            this.nuclia.db.getRetrievalAgents(account.slug, account.id, 'agent_no_memory'),
          ]),
        ),
      )
      .subscribe({
        next: ([withMemory, noMemory]) => {
          this._aragListWithMemory.next(withMemory.sort((a, b) => (a.title || '').localeCompare(b.title || '')));
          this._aragListNoMemory.next(noMemory.sort((a, b) => (a.title || '').localeCompare(b.title || '')));
          this._aragList.next(withMemory.concat(noMemory).sort((a, b) => (a.title || '').localeCompare(b.title || '')));
          this._refreshingAragList.next(false);
        },
        error: () => this._refreshingAragList.next(false),
      });

    if (refreshCurrentRa) {
      this.refreshCurrentArag().subscribe();
    }
  }

  refreshCurrentKb() {
    return forkJoin([this.currentAccount.pipe(take(1)), this.currentKb.pipe(take(1))]).pipe(
      switchMap(([account, kb]) =>
        this.nuclia.db.getKnowledgeBox(account.id, kb.id, kb.zone).pipe(
          map((data) => new WritableKnowledgeBox(this.nuclia, account.slug || account.id, data)),
          tap((newKb) => this._currentKB.next(newKb)),
        ),
      ),
    );
  }

  refreshCurrentArag() {
    return forkJoin([this.currentAccount.pipe(take(1)), this.currentArag.pipe(take(1))]).pipe(
      switchMap(([account, arag]) =>
        this.nuclia.db.getRetrievalAgent(account.id, arag.id, arag.zone).pipe(
          map((data) => new RetrievalAgent(this.nuclia, account.slug || account.id, data)),
          tap((newArag) => this._currentArag.next(newArag)),
        ),
      ),
    );
  }

  private countersRefreshSubscriptions() {
    this._refreshCounter
      .pipe(
        filter((refresh) => refresh),
        switchMap(() => this.isArag),
        switchMap((isArag) => (isArag ? of(undefined) : this.currentKb.pipe(switchMap((kb) => kb.counters())))),
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
                currentTotal = counters?.resources || 0;
              }
              const keepPulling = retries < 15 && currentTotal === counters?.resources;
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
