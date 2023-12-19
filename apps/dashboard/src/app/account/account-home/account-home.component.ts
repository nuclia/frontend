import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { IKnowledgeBoxItem, StatsRange, StatsType } from '@nuclia/core';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
import { format } from 'date-fns';
import { TranslateService } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';
import { NavigationService, TickOptions } from '@flaps/common';
import { ChartData, MetricsService } from '../metrics.service';

@Component({
  selector: 'app-account-home',
  templateUrl: './account-home.component.html',
  styleUrls: ['./account-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHomeComponent {
  account$ = this.metrics.account$;
  canUpgrade = this.metrics.canUpgrade;
  isSubscribed = this.metrics.isSubscribed;
  usage = this.metrics.accountUsage;
  totalQueries = this.metrics.totalSearchQueriesThisYear;

  kbs = this.sdk.kbList;
  statsTypes = [StatsType.MEDIA_SECONDS, StatsType.SEARCHES, StatsType.TRAIN_SECONDS];

  allCharts = true;
  charts: { [type in StatsType]: Observable<ChartData> } = this.statsTypes.reduce(
    (acc, current) => ({ ...acc, [current]: this.metrics.getChartData(current).pipe(take(1), shareReplay()) }),
    {} as { [type in StatsType]: Observable<ChartData> },
  );

  statsRange = StatsRange;
  showPending = false;
  pendingRange: BehaviorSubject<StatsRange> = new BehaviorSubject<StatsRange>(StatsRange.anHour);
  pendingTickOptions: Observable<TickOptions> = this.pendingRange.pipe(
    map((range) => {
      switch (range) {
        case StatsRange.sixHours:
        case StatsRange.twelveHours:
        case StatsRange.twentyFourHours:
          return { modulo: 6 };
        case StatsRange.fortyHeightHours:
          return { modulo: 10, displayTick: true };
        default:
          return { modulo: 10 };
      }
    }),
  );
  pending = combineLatest([this.account$, this.pendingRange]).pipe(
    switchMap(([account, pendingRange]) =>
      this.sdk.nuclia.db.getProcessingStats(pendingRange, account!.id).pipe(
        map((stats) => {
          let xFormat: string;
          switch (pendingRange) {
            case StatsRange.fortyHeightHours:
              xFormat = 'd/MM H:mm';
              break;
            default:
              xFormat = 'H:mm';
              break;
          }
          return stats.map(
            (stat, index) =>
              [format(new Date(stat.time_period), index === 0 ? 'H:mm' : xFormat), stat.stats] as [string, number],
          );
        }),
        catchError(() => {
          this.toastService.error(this.translate.instant(`account.chart_error_processing_status`));
          return of([]);
        }),
      ),
    ),
  );

  constructor(
    private sdk: SDKService,
    private toastService: SisToastService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private router: Router,
    private metrics: MetricsService,
  ) {}

  toggleCharts() {
    this.allCharts = !this.allCharts;
    this.cdr.markForCheck();
  }

  goToKb(account: string, kb: IKnowledgeBoxItem) {
    if (this.sdk.useRegionalSystem) {
      this.sdk.nuclia.options.zone = kb.zone;
    }
    this.router.navigate([this.navigation.getKbUrl(account, kb.slug || '')]);
  }
}
