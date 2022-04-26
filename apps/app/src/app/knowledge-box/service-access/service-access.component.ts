import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject, combineLatest } from 'rxjs';
import { switchMap, tap, filter, takeUntil, take } from 'rxjs/operators';
import { Account, StateService, SDKService } from '@flaps/auth';
import { TokenDialogComponent } from '../../components/token-dialog/token-dialog.component';
import { SORTED_KB_ROLES, KB_ROLE_TITLES } from '../utils';
import { KnowledgeBox, ServiceAccount, ServiceAccountCreation } from '@nuclia/core';

@Component({
  selector: 'app-service-access',
  templateUrl: './service-access.component.html',
  styleUrls: ['./service-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceAccessComponent implements OnInit, OnDestroy {
  account: Account | undefined;
  kb: KnowledgeBox | undefined;
  serviceAccess: ServiceAccount[] | undefined;
  expandedSAs: string[] = [];

  addForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    role: ['', [Validators.required]],
  });

  roles = SORTED_KB_ROLES;
  roleTitles = KB_ROLE_TITLES;

  unsubscribeAll = new Subject<void>();

  constructor(
    private stateService: StateService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private sdk: SDKService,
  ) {}

  ngOnInit(): void {
    combineLatest([this.stateService.account, this.stateService.stash])
      .pipe(
        filter(([account, kb]) => !!account && !!kb),
        tap(([account, kb]) => {
          this.account = account!;
          this.kb = kb!;
        }),
        switchMap(() => this.updateServiceAccess()),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.cdr?.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateServiceAccess(): Observable<ServiceAccount[]> {
    return this.sdk.currentKb.pipe(
      switchMap((kb) => kb.getServiceAccounts()),
      tap((list) => (this.serviceAccess = list)),
    );
  }

  addServiceAccess(): void {
    if (this.addForm.invalid) return;

    const data: ServiceAccountCreation = {
      title: this.addForm.value.title,
      role: this.addForm.value.role,
    };
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => kb.createServiceAccount(data)),
        switchMap(() => this.updateServiceAccess()),
        take(1),
      )
      .subscribe(() => {
        this.addForm.get('title')?.reset();
        this.cdr?.markForCheck();
      });
  }

  deleteServiceAccess(sa: ServiceAccount) {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => kb.deleteServiceAccount(sa.id)),
        switchMap(() => this.updateServiceAccess()),
        take(1),
      )
      .subscribe(() => {
        this.cdr?.markForCheck();
      });
  }

  createKey(sa: ServiceAccount) {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => kb.createKey(sa.id, this.getExpirationDate())),
        tap((data) => this.showToken(data.token)),
        switchMap(() => this.updateServiceAccess()),
        take(1),
      )
      .subscribe(() => {
        if (!this.isExpanded(sa.id)) {
          this.toggleSA(sa.id);
        }
        this.cdr?.markForCheck();
      });
  }

  deleteKey(sa: ServiceAccount, saKey: { id: string }) {
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => kb.deleteKey(sa.id, saKey.id)),
        switchMap(() => this.updateServiceAccess()),
        take(1),
      )
      .subscribe(() => {
        this.cdr?.markForCheck();
      });
  }

  showToken(token: string) {
    this.dialog.open(TokenDialogComponent, {
      width: '780px',
      data: { token: token },
    });
  }

  toggleSA(id: string): void {
    if (this.isExpanded(id)) {
      this.expandedSAs = this.expandedSAs.filter((item) => item !== id);
    } else {
      this.expandedSAs = [...this.expandedSAs, id];
    }
    this.cdr?.markForCheck();
  }

  isExpanded(id: string): boolean {
    return this.expandedSAs.includes(id);
  }

  private getExpirationDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return Math.floor(date.getTime() / 1000).toString();
  }
}
