import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { filter, map, switchMap, take } from 'rxjs';
import { NUAClient } from '@nuclia/core';
import { AccountNUAService } from './account-nua.service';
import { ClientDialogComponent, ClientDialogData } from './client-dialog/client-dialog.component';
import { Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { TokenDialogComponent } from '../../token-dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-account-nua',
  templateUrl: './account-nua.component.html',
  styleUrls: ['./account-nua.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountNUAComponent {
  private destroyRef = inject(DestroyRef);

  clients$ = this.nua.clients;
  isNuaActivityEnabled = this.features.unstable.viewNuaActivity;

  constructor(
    private nua: AccountNUAService,
    private router: Router,
    private sdk: SDKService,
    private navigation: NavigationService,
    private features: FeaturesService,
    private modalService: SisModalService,
  ) {
    this.nua.updateClients();
  }

  askConfirmation(client: NUAClient): void {
    this.modalService
      .openConfirm({
        title: 'account.generate_key',
        description: 'account.token_generation_warning',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.nua.renewClient(client.internal_id, client.zone)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ token }) => {
        this.showToken(token);
        this.nua.updateClients();
      });
  }

  goToActivity(client: NUAClient): void {
    this.isNuaActivityEnabled
      .pipe(
        take(1),
        filter((enabled) => enabled),
        switchMap(() => this.sdk.currentAccount),
        take(1),
        map((account) => this.navigation.getAccountUrl(account!.slug)),
      )
      .subscribe((accountUrl) => this.router.navigateByUrl(`${accountUrl}/manage/nua/${client.client_id}/activity`));
  }

  showToken(token: string) {
    this.modalService.openModal(TokenDialogComponent, {
      dismissable: true,
      data: {
        token: token,
      },
    });
  }

  createClient() {
    this.modalService
      .openModal(ClientDialogComponent)
      .onClose.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => typeof result === 'string'),
      )
      .subscribe((token) => {
        this.showToken(token);
        this.nua.updateClients();
      });
  }

  editClient(client?: NUAClient) {
    const data: ClientDialogData = { client };
    this.modalService
      .openModal(ClientDialogComponent, {
        dismissable: true,
        data,
      })
      .onClose.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((result) => !!result),
      )
      .subscribe(() => {
        this.nua.updateClients();
      });
  }

  deleteClient(client: NUAClient) {
    this.modalService
      .openConfirm({
        title: 'account.nua_key_delete',
        description: 'account.nua_key_delete_warning',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.nua.deleteClient(client.internal_id, client.zone)),
      )
      .subscribe(() => {
        this.nua.updateClients();
      });
  }
}
