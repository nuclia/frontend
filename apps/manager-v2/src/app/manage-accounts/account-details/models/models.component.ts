import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matMoreVertRound } from '@ng-icons/material-icons/round';
import { CustomModelItem } from '@nuclia/core';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDropdownMenuImports } from '@nuclia/ui-spartan/dropdown-menu';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { filter, switchMap, take } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { RegionalAccountService } from '../../regional-account.service';

@Component({
  imports: [NgIcon, RouterLink, HlmButtonImports, HlmDropdownMenuImports, HlmTableImports],
  templateUrl: './models.component.html',
  providers: [provideIcons({ matMoreVertRound })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsComponent {
  models = computed(() => this.store.accountModels().filter((zone) => zone.models.length > 0));
  canManageModels = this.store.canManageModels;

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
    private regionalService: RegionalAccountService,
    private confirmService: UiConfirmService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    toObservable(this.store.accountDetails)
      .pipe(
        filter((details) => !!details),
        take(1),
        switchMap((details) => this.accountService.loadAccountModels(details.id)),
      )
      .subscribe();
  }

  delete(model: CustomModelItem, zone: string) {
    this.confirmService
      .confirm({
        title: `Delete "${model.title}"`,
        description: `Are you sure you want to delete "${model.title}"?`,
        isDestructive: true,
        confirmLabel: 'Delete',
      })
      .pipe(
        filter((confirm) => !!confirm),
        switchMap(() => {
          const accountId = this.store.getAccountId() || '';
          return this.regionalService.deleteModel(model.model_id || '', accountId, zone);
        }),
        switchMap(() => this.accountService.loadAccountModels(this.store.getAccountId() || '')),
      )
      .subscribe();
  }

  goToDetails(model: CustomModelItem, zone: string) {
    this.router.navigate([`../models/${zone}/model/${model.model_id}/kbs`], { relativeTo: this.route });
  }
}
