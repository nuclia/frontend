import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Observable, takeUntil, switchMap, filter, take, tap, of, map } from 'rxjs';
import { StateService } from '@flaps/auth';
import { Zone, NucliaDBService, NucliaDBMeta } from '@flaps/core';
import { STFConfirmComponent } from '@flaps/components';
import { DBDialogComponent, DBDialogData } from './db-dialog/db-dialog.component';
import { TokenDialogComponent } from '../../components/token-dialog/token-dialog.component';


@Component({
  selector: 'app-account-dbs',
  templateUrl: './account-dbs.component.html',
  styleUrls: ['./account-dbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDBsComponent implements OnInit {

  @Input() zones: Zone[] | undefined;

  accountSlug = this.stateService.account.pipe(
    filter((account) => !!account),
    map((account) => account!.slug),
    take(1)
  );

  nucliaDBs?: NucliaDBMeta[];
  maxNucliaDBs: number = 1;
  expandedDBs: string[] = [];
  unsubscribeAll = new Subject<void>();

  constructor(
    private stateService: StateService,
    private nucliaDBService: NucliaDBService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.updateKeys().subscribe();
  }

  updateKeys(): Observable<NucliaDBMeta | null> {
    return this.accountSlug.pipe(
      switchMap((account) => this.nucliaDBService.getKey(account)),
      tap((data) => {
        this.nucliaDBs = data ? [data] : [];
        this.cdr?.markForCheck();
      })
    );
  }

  askConfirmation(db: NucliaDBMeta): void {
    this.dialog.open(STFConfirmComponent, {
      width: '480px',
      data: {
        title: 'generic.alert',
        message: 'account.token_generation_warning',
        confirmText: 'account.new_code',
        minWidthButtons: '110px'
      }
    }).afterClosed()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(result => {
        if (result) {
          // TODO: generate a new token
        }
      });
  }

  showToken(token: string) {
    this.dialog.open(TokenDialogComponent, {
      width: '780px',
      data: {
        token: token
      }
    });
  }

  openDialog(zones: Zone[], db?: NucliaDBMeta) {
    const data: DBDialogData = {
      zones: zones,
      nucliaDB: db
    }
    this.dialog.open(DBDialogComponent, {
      width: '780px',
      data: data
    }).afterClosed()
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap((result) => {
          if (typeof result === 'string') {
            this.showToken(result);
            return this.updateKeys();
          }
          else {
            return of()
          }
        })
      )
      .subscribe();
  }

  deleteKey() {
    this.accountSlug
      .pipe(
        switchMap((account) => this.nucliaDBService.deleteKey(account)),
        switchMap(() => this.updateKeys())
      )
      .subscribe();
  }

  toggleDB(id: string): void {
    if (this.isExpanded(id)) {
      this.expandedDBs = this.expandedDBs.filter(item => item !== id);
    }
    else {
      this.expandedDBs = [...this.expandedDBs, id];
    }
    this.cdr?.markForCheck();
  }
  
  isExpanded(id: string): boolean {
    return this.expandedDBs.includes(id);
  }
}