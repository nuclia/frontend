import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService, ZoneService } from '@flaps/core';
import { IKnowledgeBoxItem, NUAClient, UsagePoint, UsageType } from '@nuclia/core';
import {
  catchError,
  combineLatest,
  filter,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  ReplaySubject,
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { MetricsService } from '../metrics.service';

interface UsageListItem {
  id: string;
  title: string;
  icon?: string;
  enabled: boolean;
  onClick: () => void;
  zone: string;
}

@Component({
  selector: 'app-account-consumption',
  templateUrl: './account-consumption.component.html',
  styleUrl: './account-consumption.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountConsumptionComponent implements OnInit, OnDestroy {
  private metrics = inject(MetricsService);
  private sdk = inject(SDKService);
  private navigation = inject(NavigationService);
  private router = inject(Router);
  private features = inject(FeaturesService);
  private zoneService = inject(ZoneService);
  private cdr = inject(ChangeDetectorRef);

  private unsubscribeAll = new Subject<void>();

  selectedPeriod = new ReplaySubject<{ start: Date; end: Date }>(1);

  // Filled in progressively per key (kb id, nua key id, 'account'); reset to `undefined` on period change.
  usage?: { [key: string]: UsagePoint[] };
  tokensCount?: { [key: string]: number };
  accountTokens = 0;

  // Grows zone-by-zone as each zone's KBs/NUA clients resolve, instead of waiting for all zones.
  kbs: Observable<IKnowledgeBoxItem[]> = this.loadPerZone((accountId, zoneSlug) =>
    this.sdk.nuclia.db.getKnowledgeBoxesForZone(accountId, zoneSlug),
  );
  nuaKeys: Observable<NUAClient[]> = this.loadPerZone((accountId, zoneSlug) =>
    this.sdk.nuclia.db.getNUAClientsForZone(accountId, zoneSlug),
  );
  isNuaActivityEnabled = this.features.unstable.viewNuaActivity;
  totalQueries = this.metrics.getUsageCount(UsageType.SEARCHES_PERFORMED);

  // `undefined` while still loading, to distinguish from "loaded but empty".
  kbItems$: Observable<UsageListItem[] | undefined> = this.kbs.pipe(
    map((kbs) =>
      kbs.map(
        (kb): UsageListItem => ({
          id: kb.id,
          title: kb.title,
          icon: kb.state === 'PRIVATE' ? 'lock' : undefined,
          enabled: this.isNavigableKb(kb),
          onClick: () => this.goToKb(kb),
          zone: kb.zone,
        }),
      ),
    ),
    startWith(undefined),
  );

  nuaKeyItems$: Observable<UsageListItem[] | undefined> = combineLatest([this.nuaKeys, this.isNuaActivityEnabled]).pipe(
    map(([nuaKeys, enabled]) =>
      nuaKeys.map(
        (nuaKey): UsageListItem => ({
          id: nuaKey.internal_id,
          title: nuaKey.title,
          icon: 'key',
          enabled,
          onClick: () => this.goToNuaKey(nuaKey),
          zone: nuaKey.zone,
        }),
      ),
    ),
    startWith(undefined),
  );

  ngOnInit() {
    this.metrics.period.pipe(takeUntil(this.unsubscribeAll)).subscribe((period) => {
      this.selectedPeriod.next(period);
    });

    this.getUsageMap()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((usage) => {
        this.usage = usage;
        const tokensCount = usage ? this.metrics.getTokensCountByKey(usage) : undefined;
        this.accountTokens = tokensCount?.['account'] || 0;
        this.tokensCount = tokensCount;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  isNavigableKb(kb: Pick<IKnowledgeBoxItem, 'role_on_kb'>): boolean {
    return !!kb.role_on_kb;
  }

  goToKb(kb: Pick<IKnowledgeBoxItem, 'slug' | 'zone' | 'role_on_kb'>): void {
    if (!this.isNavigableKb(kb) || !kb.slug) return;

    this.metrics.account$.pipe(take(1)).subscribe((account) => {
      this.sdk.nuclia.options.zone = kb.zone;
      this.router.navigate([this.navigation.getKbUrl(account.slug, kb.slug as string)]);
    });
  }

  goToNuaKey(key: Pick<NUAClient, 'client_id'>): void {
    this.isNuaActivityEnabled
      .pipe(
        take(1),
        filter((enabled) => enabled),
        switchMap(() => this.metrics.account$),
        take(1),
      )
      .subscribe((account) => {
        this.router.navigateByUrl(`${this.navigation.getAccountManageUrl(account.slug)}/nua/${key.client_id}/activity`);
      });
  }

  /** Loads `getForZone` across all the account's zones in parallel, growing the result list as each zone resolves. */
  private loadPerZone<T>(getForZone: (accountId: string, zoneSlug: string) => Observable<T[]>): Observable<T[]> {
    return this.sdk.currentAccount.pipe(
      // scan lives inside this switchMap so the accumulator resets whenever the account changes.
      switchMap((account) =>
        this.zoneService.getZones().pipe(
          switchMap((zones) =>
            zones.length === 0
              ? of([] as T[])
              : merge(...zones.map((zone) => getForZone(account.id, zone.slug).pipe(catchError(() => of([] as T[]))))),
          ),
          scan((acc, zoneItems) => acc.concat(zoneItems), [] as T[]),
        ),
      ),
      shareReplay(1),
    );
  }

  /** Emits only items not seen in a previous emission of `source$`, so growing lists don't re-trigger requests for items already loaded. */
  private newItemsOnly<T>(source$: Observable<T[]>, keyFn: (item: T) => string): Observable<T[]> {
    return source$.pipe(
      scan(
        (acc, list) => {
          const added = list.filter((item) => !acc.seen.has(keyFn(item)));
          added.forEach((item) => acc.seen.add(keyFn(item)));
          return { seen: acc.seen, added };
        },
        { seen: new Set<string>(), added: [] as T[] },
      ),
      map((result) => result.added),
      filter((added) => added.length > 0),
    );
  }

  /** Emits usage progressively per key (kb/nua-key/account) instead of waiting for every request via `forkJoin`. */
  private getUsageMap(): Observable<{ [key: string]: UsagePoint[] } | undefined> {
    return combineLatest([this.metrics.account$, this.selectedPeriod]).pipe(
      switchMap(([account, period]) => {
        const getUsageEntry = (key: string, kbId?: string, nuaKeyId?: string) =>
          this.sdk.nuclia.db
            .getUsage(account.id, period.start.toISOString(), period.end.toISOString(), kbId, undefined, nuaKeyId)
            .pipe(
              map((usage) => ({ key, usage })),
              catchError(() => of({ key, usage: [] as UsagePoint[] })),
            );

        const newKbUsage$ = this.newItemsOnly(this.kbs, (kb) => kb.id).pipe(
          mergeMap((kbs) => merge(...kbs.map((kb) => getUsageEntry(kb.id, kb.id)))),
        );
        const newNuaUsage$ = this.newItemsOnly(this.nuaKeys, (nuaKey) => nuaKey.internal_id).pipe(
          mergeMap((nuaKeys) =>
            merge(...nuaKeys.map((nuaKey) => getUsageEntry(nuaKey.internal_id, undefined, nuaKey.internal_id))),
          ),
        );
        const accountUsage$ = getUsageEntry('account');

        return merge(newKbUsage$, newNuaUsage$, accountUsage$).pipe(
          scan((acc, curr) => ({ ...acc, [curr.key]: curr.usage }), {} as { [key: string]: UsagePoint[] }),
          // Reset to `undefined` so the UI shows skeletons again while the new period loads.
          startWith(undefined),
        );
      }),
      shareReplay(1),
    );
  }
}
