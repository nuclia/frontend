import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SDKService, StateService } from '@flaps/core';
import { Account, StatsPeriod, StatsType } from '@nuclia/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, share, switchMap } from 'rxjs';
import { AppService } from '../../services/app.service';
import { eachDayOfInterval, format, getDaysInMonth, isThisMonth, lastDayOfMonth } from 'date-fns';

type ProcessedViewType = StatsType.CHARS | StatsType.MEDIA_SECONDS | StatsType.DOCS_NO_MEDIA;

@Component({
  selector: 'app-account-home',
  templateUrl: './account-home.component.html',
  styleUrls: ['./account-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHomeComponent {
  statsType = StatsType;
  selectedTab: 'completed' | 'pending' = 'completed';

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
      this.sdk.nuclia.db.getStats(account!.slug, statsType, undefined, StatsPeriod.MONTH),
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
  totalQueries = this.account.pipe(
    switchMap((account) => this.sdk.nuclia.db.getStats(account!.slug, StatsType.SEARCHES, undefined, StatsPeriod.YEAR)),
    map((stats) => stats.reduce((acc, stat) => acc + stat.stats, 0)),
  );
  locale = this.appService.currentLocale;

  constructor(private sdk: SDKService, private stateService: StateService, private appService: AppService) {}
}
