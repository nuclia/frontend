import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { IKnowledgeBoxItem, NUAClient, UsagePoint, UsageType } from '@nuclia/core';
import {
  combineLatest,
  filter,
  forkJoin,
  map,
  ReplaySubject,
  shareReplay,
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
  private cdr = inject(ChangeDetectorRef);

  private unsubscribeAll = new Subject<void>();

  selectedPeriod = new ReplaySubject<{ start: Date; end: Date }>(1);

  usage?: { [key: string]: UsagePoint[] };
  tokensCount?: { [key: string]: number };
  accountTokens = 0;

  kbs = this.sdk.kbList;
  nuaKeys = this.sdk.currentAccount.pipe(
    switchMap((account) => this.sdk.nuclia.db.getNUAClients(account.id)),
    shareReplay(1),
  );
  isNuaActivityEnabled = this.features.unstable.viewNuaActivity;
  totalQueries = this.metrics.getUsageCount(UsageType.SEARCHES_PERFORMED);

  kbItems$ = this.kbs.pipe(
    map((kbs) =>
      kbs.map(
        (kb): UsageListItem => ({
          id: kb.id,
          title: kb.title,
          icon: kb.state === 'PRIVATE' ? 'lock' : undefined,
          enabled: this.isNavigableKb(kb),
          onClick: () => this.goToKb(kb),
        }),
      ),
    ),
  );

  nuaKeyItems$ = combineLatest([this.nuaKeys, this.isNuaActivityEnabled]).pipe(
    map(([nuaKeys, enabled]) =>
      nuaKeys.map(
        (nuaKey): UsageListItem => ({
          id: nuaKey.internal_id,
          title: nuaKey.title,
          icon: 'key',
          enabled,
          onClick: () => this.goToNuaKey(nuaKey),
        }),
      ),
    ),
  );

  ngOnInit() {
    this.metrics.period.pipe(takeUntil(this.unsubscribeAll)).subscribe((period) => {
      this.selectedPeriod.next(period);
    });

    this.getUsageMap()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((usage) => {
        this.usage = usage;
        const tokensCount = this.metrics.getTokensCountByKey(usage);
        this.accountTokens = tokensCount['account'] || 0;
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

  private getUsageMap() {
    return combineLatest([this.metrics.account$, this.selectedPeriod, this.kbs, this.nuaKeys]).pipe(
      switchMap(([account, period, kbs, nuaKeys]) => {
        const requests = kbs
          .map((kb) =>
            this.sdk.nuclia.db
              .getUsage(account.id, period.start.toISOString(), period.end.toISOString(), kb.id)
              .pipe(map((usage) => ({ key: kb.id, usage }))),
          )
          .concat(
            nuaKeys.map((nuaKey) =>
              this.sdk.nuclia.db
                .getUsage(
                  account.id,
                  period.start.toISOString(),
                  period.end.toISOString(),
                  undefined,
                  undefined,
                  nuaKey.internal_id,
                )
                .pipe(map((usage) => ({ key: nuaKey.internal_id, usage }))),
            ),
          )
          .concat([
            this.sdk.nuclia.db
              .getUsage(account.id, period.start.toISOString(), period.end.toISOString())
              .pipe(map((usage) => ({ key: 'account', usage }))),
          ]);
        return forkJoin(requests);
      }),
      map((usage) =>
        usage.reduce(
          (acc, curr) => {
            acc[curr.key] = curr.usage;
            return acc;
          },
          {} as { [key: string]: UsagePoint[] },
        ),
      ),
      shareReplay(1),
    );
  }
}
