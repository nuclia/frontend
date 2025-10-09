import { ChangeDetectionStrategy, Component } from '@angular/core';
import { filter, Observable, shareReplay, switchMap } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { KbCounters, KbSummary } from '../../account-ui.models';
import { AccountService } from '../../account.service';

@Component({
  templateUrl: './knowledge-boxes.component.html',
  styleUrls: ['./knowledge-boxes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KnowledgeBoxesComponent {
  kbList: Observable<KbSummary[]> = this.store.kbList;
  canAccessKBs = this.store.canAccessKBs;
  counters: Observable<KbCounters> = this.kbList.pipe(
    filter((kbs) => kbs.length > 0),
    switchMap((kbs) => this.accountService.loadKbCounters(kbs)),
    shareReplay(),
  );

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
  ) {}
}
