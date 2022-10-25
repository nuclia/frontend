import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SDKService, StateService } from '@flaps/core';
import { Account, StatsPeriod, StatsRange, StatsType } from '@nuclia/core';
import { BehaviorSubject, catchError, combineLatest, filter, map, Observable, of, share, switchMap } from 'rxjs';
import { AppService } from '../../services/app.service';
import { eachDayOfInterval, format, getDaysInMonth, isThisMonth, lastDayOfMonth } from 'date-fns';
import { ToastService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { TickOptions } from '../../components/charts/chart-utils';

type ProcessedViewType = StatsType.CHARS | StatsType.MEDIA_SECONDS | StatsType.DOCS_NO_MEDIA;

@Component({
  selector: 'app-account-home',
  templateUrl: './account-home.component.html',
  styleUrls: ['./account-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHomeComponent {
  statsType = StatsType;
  statsRange = StatsRange;
  selectedTab: BehaviorSubject<'completed' | 'pending'> = new BehaviorSubject<'completed' | 'pending'>('completed');

  account = this.stateService.account.pipe(filter((account) => !!account));
  isFreeAccount = this.account.pipe(map((account) => account && account.type === 'stash-basic'));

  processedView: BehaviorSubject<ProcessedViewType> = new BehaviorSubject<ProcessedViewType>(StatsType.CHARS);
  processedThreshold: Observable<number> = combineLatest([this.account, this.processedView]).pipe(
    filter(([account]) => !!account),
    map(([account, statsType]) => {
      const limits = (account as Account).limits.processing;
      switch (statsType) {
        case StatsType.CHARS:
          return limits.monthly_limit_chars_processed;
        case StatsType.MEDIA_SECONDS:
          return limits.monthly_limit_media_seconds_processed;
        case StatsType.DOCS_NO_MEDIA:
          return limits.monthly_limit_non_media_files_processed;
      }
    }),
  );

  kb = this.sdk.currentKb;
  kbs = this.account.pipe(
    switchMap((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account?.slug!)),
    share(),
  );
  kbsTotal = this.kbs.pipe(map((kbs) => kbs.length));
  kbsPublic = this.kbs.pipe(map((kbs) => kbs.filter((kb) => kb.state === 'PUBLISHED').length));

  private _processing = combineLatest([this.account, this.processedView]).pipe(
    switchMap(([account, statsType]) =>
      this.sdk.nuclia.db.getStats(account!.slug, statsType, undefined, StatsPeriod.MONTH).pipe(
        catchError(() => {
          this.toastService.openError(this.translate.instant(`account.chart_error_${statsType}`));
          return of([]);
        }),
      ),
    ),
    share(),
  );

  processing = this._processing.pipe(
    map((stats) =>
      stats
        .map((stat) => [new Date(stat.time_period), stat.stats] as [Date, number])
        .reverse()
        // Keep only points in current month
        .reduce((currentMonthStats, point, currentIndex, source) => {
          if (isThisMonth(point[0])) {
            currentMonthStats.push(point);
          }
          // Fill the rest of the month with 0
          const now = Date.now();
          if (currentIndex === source.length - 1 && currentMonthStats.length !== getDaysInMonth(now)) {
            const lastDay = lastDayOfMonth(now);
            const interval = eachDayOfInterval({ start: point[0], end: lastDay });
            currentMonthStats = currentMonthStats.concat(interval.map((date) => [date, 0]));
          }
          return currentMonthStats;
        }, [] as [Date, number][])
        .map((stat) => [format(stat[0], 'd'), stat[1]] as [string, number]),
    ),
  );

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
  pending = combineLatest([this.selectedTab, this.account, this.pendingRange]).pipe(
    filter(([tab]) => tab === 'pending'),
    switchMap(([tab, account, pendingRange]) =>
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
          this.toastService.openError(this.translate.instant(`account.chart_error_processing_status`));
          return of([]);
        }),
      ),
    ),
  );

  totalQueries = this.account.pipe(
    switchMap((account) => this.sdk.nuclia.db.getStats(account!.slug, StatsType.SEARCHES, undefined, StatsPeriod.YEAR)),
    map((stats) => stats.reduce((acc, stat) => acc + stat.stats, 0)),
  );
  locale = this.appService.currentLocale;

  constructor(
    private sdk: SDKService,
    private stateService: StateService,
    private appService: AppService,
    private toastService: ToastService,
    private translate: TranslateService,
  ) {}
}
