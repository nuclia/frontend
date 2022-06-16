import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, switchMap, filter } from 'rxjs';
import { NUAClient } from '@nuclia/core';
import { Zone } from '@flaps/core';
import { STFConfirmComponent } from '@flaps/components';
import { AccountNUAService } from './account-nua.service';
import { ClientDialogComponent, ClientDialogData } from './client-dialog/client-dialog.component';
import { TokenDialogComponent } from '../../components/token-dialog/token-dialog.component';

@Component({
  selector: 'app-account-nua',
  templateUrl: './account-nua.component.html',
  styleUrls: ['./account-nua.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountNUAComponent {
  @Input() zones: Zone[] | undefined;

  clients = this.nua.clients;
  expanded: string[] = [];
  unsubscribeAll = new Subject<void>();

  constructor(private nua: AccountNUAService, private dialog: MatDialog, private cdr: ChangeDetectorRef) {
    this.nua.updateClients();
  }

  askConfirmation(client: NUAClient): void {
    this.dialog
      .open(STFConfirmComponent, {
        width: '480px',
        data: {
          title: 'generic.alert',
          message: 'account.token_generation_warning',
          confirmText: 'account.new_code',
          minWidthButtons: '110px',
        },
      })
      .afterClosed()
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((result) => !!result),
        switchMap(() => this.nua.renewClient(client.client_id)),
      )
      .subscribe(({ token }) => {
        this.showToken(token);
        this.nua.updateClients();
      });
  }

  goToActivity(client: NUAClient): void {
    console.log('Go to Activity logs for', client);
  }

  showToken(token: string) {
    this.dialog.open(TokenDialogComponent, {
      width: '780px',
      data: {
        token: token,
      },
    });
  }

  openDialog(zones: Zone[], client?: NUAClient) {
    const data: ClientDialogData = { zones, client };
    this.dialog
      .open(ClientDialogComponent, {
        width: '780px',
        data: data,
      })
      .afterClosed()
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((result) => typeof result === 'string'),
      )
      .subscribe((token) => {
        this.showToken(token);
        this.nua.updateClients();
      });
  }

  deleteClient(id: string) {
    this.nua.deleteClient(id).subscribe(() => {
      this.nua.updateClients();
    });
  }

  toggleClient(id: string): void {
    if (this.isExpanded(id)) {
      this.expanded = this.expanded.filter((item) => item !== id);
    } else {
      this.expanded = [...this.expanded, id];
    }
    this.cdr?.markForCheck();
  }

  isExpanded(id: string): boolean {
    return this.expanded.includes(id);
  }
}
