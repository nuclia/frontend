import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SisModalService } from '@nuclia/sistema';
import { filter, map, switchMap, take } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaDropdownModule, PaPopupModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { RegionalAccountService } from '../../regional-account.service';
import { CustomModelItem } from '@nuclia/core';
import { AccountService } from '../../account.service';
import { RouterModule } from '@angular/router';

@Component({
  imports: [CommonModule, PaButtonModule, PaDropdownModule, PaPopupModule, PaTableModule, RouterModule],
  templateUrl: './models.component.html',
  styleUrls: ['./models.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsComponent {
  models = this.store.accountModels.pipe(map((models) => models.filter((zone) => zone.models.length > 0)));

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
    private regionalService: RegionalAccountService,
    private modalService: SisModalService,
  ) {
    this.store.accountDetails
      .pipe(
        filter((details) => !!details),
        take(1),
        switchMap((details) => this.accountService.loadAccountModels(details.id)),
      )
      .subscribe();
  }

  delete(event: Event, model: CustomModelItem, zone: string) {
    event.preventDefault();
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: `Delete "${model.title}"`,
        description: `Are you sure you want to delete "${model.title}"?`,
        isDestructive: true,
        confirmLabel: 'Delete',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => {
          const accountId = this.store.getAccountId() || '';
          return this.regionalService.deleteModel(model.model_id || '', accountId, zone);
        }),
        switchMap(() => this.accountService.loadAccountModels(this.store.getAccountId() || '')),
      )
      .subscribe();
  }
}
