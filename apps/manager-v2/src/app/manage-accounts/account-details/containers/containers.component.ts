import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map, Observable, shareReplay, switchMap } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { KbCounters, KbSummary } from '../../account-ui.models';
import { AccountService } from '../../account.service';

/**
 * Displays either the Knowledge boxes or the Agents belonging to the account, depending on the
 * `mode` route data (see `manage-accounts.module.ts`).
 */
@Component({
  templateUrl: './containers.component.html',
  styleUrls: ['./containers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ContainersComponent {
  private store = inject(ManagerStore);
  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);

  private showKbs = this.route.snapshot.data['mode'] !== 'agent';
  title = this.showKbs ? 'Knowledge Boxes' : 'Agents';

  containerList: Observable<KbSummary[]> = this.store.kbList.pipe(
    map((kbs) => kbs.filter((kb) => (this.showKbs ? kb.kbMode === 'kb' : kb.kbMode !== 'kb'))),
  );
  canAccessKBs = this.store.canAccessKBs;
  counters: Observable<KbCounters> = this.containerList.pipe(
    filter((kbs) => kbs.length > 0),
    switchMap((kbs) => this.accountService.loadKbCounters(kbs)),
    shareReplay(),
  );
}
