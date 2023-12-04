import { ChangeDetectionStrategy, Component } from '@angular/core';
import { combineLatest, filter, map, Observable, shareReplay, switchMap } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails, KbCounters, KbSummary } from '../../account-ui.models';
import { AccountService } from '../../account.service';

@Component({
  templateUrl: './knowledge-boxes.component.html',
  styleUrls: ['./knowledge-boxes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxesComponent {
  kbList: Observable<KbSummary[]> = this.store.kbList;
  counters: Observable<KbCounters> = combineLatest([this.store.accountDetails, this.kbList]).pipe(
    filter(([account, kbs]) => !!account && kbs.length > 0),
    map(([account, kbs]) => [account, kbs] as [AccountDetails, KbSummary[]]),
    switchMap(([account, kbs]) => this.accountService.loadKbCounters((account as AccountDetails).id, kbs)),
    shareReplay(),
  );

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
  ) {}

  openActivity(event: Event, kbId: string) {
    event.stopPropagation();
    window.open(`http://redash.nuclia.com/queries/24?p_KB=${kbId}`, '_blank', 'noopener,noreferrer');
  }
}
