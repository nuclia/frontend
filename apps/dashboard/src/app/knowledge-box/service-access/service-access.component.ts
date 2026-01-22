import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ExpirationModalComponent, TokenDialogComponent, KB_ROLE_TITLES, SORTED_KB_ROLES } from '@flaps/common';
import { FeaturesService, SDKService } from '@flaps/core';
import { Account, KnowledgeBox, ServiceAccount, ServiceAccountCreation } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { combineLatest, Observable, Subject } from 'rxjs';
import { catchError, filter, switchMap, take, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-service-access',
  templateUrl: './service-access.component.html',
  styleUrls: ['./service-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ServiceAccessComponent implements OnInit, OnDestroy {
  isTrial = this.features.isTrial;
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
    private formBuilder: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
    private sdk: SDKService,
    private features: FeaturesService,
    private toaster: SisToastService,
  ) {}

  ngOnInit(): void {
    combineLatest([this.sdk.currentAccount, this.sdk.currentKb])
      .pipe(
        tap(([account, kb]) => {
          this.account = account;
          this.kb = kb;
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
        switchMap((serviceAccounts) => {
          const sa = serviceAccounts.find((service) => service.title === data.title);
          return this._createKey(sa?.id || '');
        }),
      )
      .subscribe();
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

  createKey(id: string) {
    this._createKey(id).subscribe();
  }

  private _createKey(id: string) {
    return this.modalService.openModal(ExpirationModalComponent).onClose.pipe(
      filter((expiration) => !!expiration),
      switchMap(({ expiration }) =>
        this.sdk.currentKb.pipe(
          take(1),
          switchMap((kb) => kb.createKey(id, this.getTimestamp(expiration))),
          tap((data) => this.showToken(data.token)),
          switchMap(() => this.updateServiceAccess()),
        ),
      ),
      catchError((error) => {
        this.toaster.error('api-key-management.create-key.error');
        throw error;
      }),
      tap(() => {
        if (!this.isExpanded(id)) {
          this.toggleSA(id);
        }
        this.cdr?.markForCheck();
      }),
    );
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

  private getTimestamp(date: string): string {
    return Math.floor(new Date(date).getTime() / 1000).toString();
  }
}
