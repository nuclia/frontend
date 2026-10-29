import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { FeaturesService, HintComponent, SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ServiceAccount, ServiceAccountCreation } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { combineLatest, Observable, Subject, throwError } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { ExpirationModalComponent, TokenDialogComponent } from '../../token-dialog';
import { KB_ROLE_TITLES, SORTED_KB_ROLES } from '../../utils';

@Component({
  selector: 'app-service-access',
  templateUrl: './service-access.component.html',
  styleUrls: ['./service-access.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, PaButtonModule, ReactiveFormsModule, PaTextFieldModule, CommonModule, HintComponent],
})
export class ServiceAccessComponent implements OnInit, OnDestroy {
  isTrial = this.features.isTrial;
  serviceAccess: ServiceAccount[] | undefined;
  expandedSAs: string[] = [];
  isContextBox = this.sdk.currentAccount.pipe(map((account) => account.workflow === 'cowork'));
  contextBoxArag = combineLatest([this.sdk.currentAccount, this.sdk.aragList]).pipe(
    take(1),
    switchMap(([account, arags]) => {
      const arag = arags[0];
      this.sdk.nuclia.options.zone = arag?.zone;
      return arag
        ? this.sdk.nuclia.db.getRetrievalAgent(account.id, arag.id, arag.zone)
        : throwError(() => new Error('No Retrieval Agent found for this Content Box'));
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
  kb = this.isContextBox.pipe(
    take(1),
    switchMap((isContextBox) => (isContextBox ? this.contextBoxArag : this.sdk.currentKb)),
  );

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
    this.updateServiceAccess().subscribe(() => {
      this.cdr?.markForCheck();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateServiceAccess(): Observable<ServiceAccount[]> {
    return this.kb.pipe(
      take(1),
      switchMap((kb) => kb.getServiceAccounts()),
      tap((list) => (this.serviceAccess = list)),
    );
  }

  addServiceAccess(): void {
    if (this.addForm.invalid) return;

    const data: ServiceAccountCreation = this.addForm.getRawValue();
    this.kb
      .pipe(
        take(1),
        switchMap((kb) => kb.createServiceAccount(data)),
        switchMap(() => this.updateServiceAccess()),
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
    this.kb
      .pipe(
        take(1),
        switchMap((kb) => kb.deleteServiceAccount(sa.id)),
        switchMap(() => this.updateServiceAccess()),
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
        this.kb.pipe(
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
    this.kb
      .pipe(
        take(1),
        switchMap((kb) => kb.deleteKey(sa.id, saKey.id)),
        switchMap(() => this.updateServiceAccess()),
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
