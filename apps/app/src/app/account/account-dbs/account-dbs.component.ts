import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Account } from '@flaps/auth';
import { Zone, NucliaDBService, NucliaDBMeta } from '@flaps/core';
import { STFConfirmComponent } from '@flaps/components';
import { DBDialogComponent, DBDialogData } from './db-dialog/db-dialog.component';
import { TokenDialogComponent } from '../../components/token-dialog/token-dialog.component';


@Component({
  selector: 'app-account-dbs',
  templateUrl: './account-dbs.component.html',
  styleUrls: ['./account-dbs.component.scss']
})
export class AccountDBsComponent implements OnInit {

  @Input() account: Account | undefined;
  @Input() zones: Zone[] | undefined;

  nucliaDBs: NucliaDBMeta[] | undefined;
  maxNucliaDBs: number = 1;
  expandedDBs: string[] = [];
  unsubscribeAll = new Subject<void>();

  constructor(private nucliaDBService: NucliaDBService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.updateKeys();
  }

  updateKeys() {
    if (this.account?.slug) {
      this.nucliaDBService.getKey(this.account.slug).subscribe(data => {
        this.nucliaDBs = data ? [data] : [];
      })
    }
  }

  askConfirmation(db: NucliaDBMeta): void {
    const dialogConfirmationRef = this.dialog.open(STFConfirmComponent, {
      width: '480px',
      data: {
        title: 'generic.alert',
        message: 'account.token_generation_warning',
        confirmText: 'account.new_code',
        minWidthButtons: '110px'
      }
    });
    dialogConfirmationRef.afterClosed()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(result => {
        if (result) {
          // TODO: generate a new token
        }
      });
  }

  showToken(token: string) {
    const dialogRef = this.dialog.open(TokenDialogComponent, {
      width: '780px',
      data: {
        token: token
      }
    });
  }

  openDialog(zones: Zone[], account: Account, db?: NucliaDBMeta) {
      const data: DBDialogData = {
        zones: zones,
        account: account,
        nucliaDB: db
      }
      const dialogRef = this.dialog.open(DBDialogComponent, {
        width: '780px',
        data: data
      });
      dialogRef.afterClosed()
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe(result => {
          if (typeof result === 'string') {
            this.showToken(result);
            this.updateKeys();
          }
        });
  }

  deleteKey() {
    this.nucliaDBService.deleteKey(this.account!.slug).subscribe(() => {
      this.updateKeys();
    })
  }

  toggleDB(id: string): void {
    if (this.isExpanded(id)) {
      this.expandedDBs = this.expandedDBs.filter(item => item !== id);
    }
    else {
      this.expandedDBs = [...this.expandedDBs, id];
    }
  }
  
  isExpanded(id: string): boolean {
    return this.expandedDBs.includes(id);
  }
}