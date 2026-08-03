import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { IKnowledgeBoxItem, UsagePoint, UsageType } from '@nuclia/core';
import { combineLatest, forkJoin, map, ReplaySubject, shareReplay, Subject, switchMap, takeUntil } from 'rxjs';
import { MetricsService } from '../metrics.service';

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
  private cdr = inject(ChangeDetectorRef);

  private unsubscribeAll = new Subject<void>();

  selectedPeriod = new ReplaySubject<{ start: Date; end: Date }>(1);

  usage?: { [key: string]: UsagePoint[] };
  tokensCount?: { [key: string]: number };
  accountTokens = 0;
  accountSlug = '';

  kbs = this.sdk.kbList;
  totalQueries = this.metrics.getUsageCount(UsageType.SEARCHES_PERFORMED);

  ngOnInit() {
    this.metrics.account$.pipe(takeUntil(this.unsubscribeAll)).subscribe((account) => {
      this.accountSlug = account.slug;
    });

    this.metrics.period.pipe(takeUntil(this.unsubscribeAll)).subscribe((period) => {
      this.selectedPeriod.next(period);
    });

    combineLatest([this.getUsageMap(), this.kbs])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([usage]) => {
        this.usage = usage;
        this.accountTokens = usage['account']?.[0]?.metrics?.find((m) => m.name === 'nuclia_tokens_billed')?.value || 0;
        this.tokensCount = Object.entries(usage).reduce(
          (acc, [key, value]) => {
            if (key !== 'account') {
              acc[key] = value[0]?.metrics?.find((m) => m.name === 'nuclia_tokens_billed')?.value || 0;
            }
            return acc;
          },
          {} as { [key: string]: number },
        );
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  isTitleTruncated(element: HTMLElement | null): boolean {
    return !!element && element.scrollWidth > element.clientWidth;
  }

  isNavigableKb(kb: Pick<IKnowledgeBoxItem, 'role_on_kb'>): boolean {
    return !!kb.role_on_kb;
  }

  goToKb(kb: Pick<IKnowledgeBoxItem, 'slug' | 'zone'>): void {
    if (!kb.slug) return;
    this.sdk.nuclia.options.zone = kb.zone;
    this.router.navigate([this.navigation.getKbUrl(this.accountSlug, kb.slug)]);
  }

  private getUsageMap() {
    return combineLatest([this.metrics.account$, this.selectedPeriod, this.kbs]).pipe(
      switchMap(([account, period, kbs]) => {
        const requests = kbs
          .map((kb) =>
            this.sdk.nuclia.db
              .getUsage(account.id, period.start.toISOString(), period.end.toISOString(), kb.id)
              .pipe(map((usage) => ({ key: kb.id, usage }))),
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
