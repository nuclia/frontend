import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { STFPipesModule } from '@flaps/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matLockRound } from '@ng-icons/material-icons/round';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { filter, map, Observable, shareReplay, switchMap } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { KbCounters, KbSummary } from '../../account-ui.models';
import { AccountService } from '../../account.service';

/**
 * Displays either the Knowledge boxes or the Agents belonging to the account, depending on the
 * `mode` route data (see `manage-accounts.routes.ts`).
 */
@Component({
  templateUrl: './containers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmTableImports, NgIcon, RouterLink, AsyncPipe, DecimalPipe, STFPipesModule],
  providers: [provideIcons({ matLockRound })],
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
