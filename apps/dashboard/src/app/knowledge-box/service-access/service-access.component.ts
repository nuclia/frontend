import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { SDKService, StateService } from '@flaps/core';
import { KB_ROLE_TITLES, SORTED_KB_ROLES } from '../utils';
import { Account, KnowledgeBox, ServiceAccount, ServiceAccountCreation } from '@nuclia/core';
import { TokenDialogComponent } from '@flaps/common';
import { SisModalService } from '@nuclia/sistema';

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
    private formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
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

    const data: ServiceAccountCreation = this.addForm.getRawValue();
    this.sdk.currentKb
      .pipe(
        switchMap((kb) => kb.createServiceAccount(data)),
        switchMap(() => this.updateServiceAccess()),
        take(1),
        tap(() => {
          this.addForm.get('title')?.reset();
          this.cdr?.markForCheck();
        }),
      )
      .subscribe((serviceAccounts) => {
        const sa = serviceAccounts.find((service) => service.title === data.title);
        if (sa) {
          this.createKey(sa);
        }
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
    this.modalService.openModal(TokenDialogComponent, {
      dismissable: true,
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
