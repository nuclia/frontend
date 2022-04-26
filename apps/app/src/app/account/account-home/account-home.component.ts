import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SDKService, StateService } from '@flaps/auth';
import { StatsPeriod, StatsType } from '@nuclia/core';
import { filter, map, share, switchMap } from 'rxjs';

@Component({
  selector: 'app-account-home',
  templateUrl: './account-home.component.html',
  styleUrls: ['./account-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHomeComponent {
  account = this.stateService.account.pipe(filter((account) => !!account));
  kb = this.sdk.currentKb;
  kbs = this.account.pipe(
    switchMap((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account?.slug!)),
    share(),
  );
  kbsTotal = this.kbs.pipe(map((kbs) => kbs.length));
  kbsPublic = this.kbs.pipe(map((kbs) => kbs.filter((kb) => kb.state === 'PUBLISHED').length));
  kbSlug = this.sdk.currentKb.pipe(map((kb) => kb.slug));
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
  constructor(private sdk: SDKService, private stateService: StateService) {}
}
