import { ChangeDetectionStrategy, Component } from '@angular/core';
import { filter, Observable, shareReplay, switchMap } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { KbCounters, KbSummary } from '../../account-ui.models';
import { AccountService } from '../../account.service';

@Component({
  templateUrl: './knowledge-boxes.component.html',
  styleUrls: ['./knowledge-boxes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxesComponent {
  kbList: Observable<KbSummary[]> = this.store.kbList;
  counters: Observable<KbCounters> = this.kbList.pipe(
    filter((kbs) => kbs.length > 0),
    switchMap((kbs) => this.accountService.loadKbCounters(kbs)),
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
