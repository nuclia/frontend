import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SDKService, StateService } from '@flaps/core';
import { StatsPeriod, StatsType } from '@nuclia/core';
import { filter, map, of, share, switchMap } from 'rxjs';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'app-account-home',
  templateUrl: './account-home.component.html',
  styleUrls: ['./account-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHomeComponent {
  selectedTab: 'completed' | 'pending' = 'completed';
  account = this.stateService.account.pipe(filter((account) => !!account));
  kb = this.sdk.currentKb;
  kbs = this.account.pipe(
    switchMap((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account?.slug!)),
    share(),
  );
  kbsTotal = this.kbs.pipe(map((kbs) => kbs.length));
  kbsPublic = this.kbs.pipe(map((kbs) => kbs.filter((kb) => kb.state === 'PUBLISHED').length));
  private _processing = this.account.pipe(
    switchMap((account) => this.sdk.nuclia.db.getStats(account!.slug, StatsType.CHARS, undefined, StatsPeriod.MONTH)),
    share(),
  );
  processing = this._processing.pipe(
    map((stats) =>
      stats
        .map((stat) => [new Date(stat.time_period), stat.stats] as [Date, number])
        .map(
          (stat) =>
            [stat[0].toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' }), stat[1]] as [string, number],
        )
        .reverse(),
    ),
  );
  totalQueries = this.account.pipe(
    switchMap((account) => this.sdk.nuclia.db.getStats(account!.slug, StatsType.SEARCHES, undefined, StatsPeriod.YEAR)),
    map((stats) => stats.reduce((acc, stat) => acc + stat.stats, 0)),
  );
  locale = this.appService.currentLocale;

  activity = [{ resource: of('resource'), date: '', username: of('username') }];

  constructor(private sdk: SDKService, private stateService: StateService, private appService: AppService) {}
}
