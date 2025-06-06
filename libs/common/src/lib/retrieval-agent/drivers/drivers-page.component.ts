import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SDKService, STFUtils } from '@flaps/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Driver, DriverCreation } from '@nuclia/core';
import { DropdownButtonComponent, InfoCardComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { catchError, filter, map, Observable, of, Subject, switchMap, take, takeUntil, tap, throwError } from 'rxjs';
import { CypherDriverModalComponent } from './cypher-driver';
import { GuardrailsDriverModalComponent } from './guardrails-driver';
import { InternetDriverModalComponent } from './internet-driver';
import { McpSseDriverModalComponent, McpStdioDriverModalComponent } from './mcp-driver';
import { NucliaDriverModalComponent } from './nuclia-driver';
import { SqlDriverModalComponent } from './sql-driver';

@Component({
  selector: 'app-drivers-panel',
  imports: [
    CommonModule,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTableModule,
    DropdownButtonComponent,
    InfoCardComponent,
    TranslateModule,
  ],
  templateUrl: './drivers-page.component.html',
  styleUrl: './drivers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversPageComponent implements OnInit, OnDestroy {
  private sdk = inject(SDKService);
  private modal = inject(SisModalService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);

  private _unsubscribeAll = new Subject<void>();

  drivers = signal<Driver[]>([]);
  hasAllInternetDrivers = computed(
    () =>
      this.drivers().some((driver) => driver.provider === 'brave') &&
      this.drivers().some((driver) => driver.provider === 'perplexity') &&
      this.drivers().some((driver) => driver.provider === 'tavily'),
  );

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        switchMap((arag) => arag.getDrivers()),
        catchError((error) => {
          if (error.status === 404) {
            return of([]);
          } else {
            return throwError(() => error);
          }
        }),
        tap((drivers) => this.drivers.set(drivers)),
        takeUntil(this._unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  addDriver(type: 'nuclia' | 'internet' | 'guardrails' | 'sql' | 'cypher' | 'mcpsse' | 'mcpstdio') {
    let modalRef$: Observable<ModalRef>;
    switch (type) {
      case 'nuclia':
        modalRef$ = this.sdk.kbList.pipe(
          map((kbList) => this.modal.openModal(NucliaDriverModalComponent, new ModalConfig({ data: { kbList } }))),
        );
        break;
      case 'internet':
        modalRef$ = of(
          this.modal.openModal(InternetDriverModalComponent, new ModalConfig({ data: { driverList: this.drivers() } })),
        );
        break;
      case 'sql':
        modalRef$ = of(this.modal.openModal(SqlDriverModalComponent));
        break;
      case 'cypher':
        modalRef$ = of(this.modal.openModal(CypherDriverModalComponent));
        break;
      case 'mcpsse':
        modalRef$ = of(this.modal.openModal(McpSseDriverModalComponent));
        break;
      case 'mcpstdio':
        modalRef$ = of(this.modal.openModal(McpStdioDriverModalComponent));
        break;
      case 'guardrails':
        modalRef$ = of(this.modal.openModal(GuardrailsDriverModalComponent));
        break;
    }
    modalRef$
      .pipe(
        switchMap((modalRef) => modalRef.onClose),
        filter((driver) => !!driver),
        map((driver: DriverCreation) => {
          return {
            ...driver,
            identifier: `${driver.provider}-${STFUtils.generateRandomSlugSuffix()}`,
          };
        }),
        switchMap((driver) =>
          this.sdk.currentArag.pipe(
            take(1),
            switchMap((arag) => arag.addDriver(driver)),
          ),
        ),
        switchMap(() => this.sdk.refreshCurrentArag()),
      )
      .subscribe({
        error: () => {
          this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.creation'));
        },
      });
  }

  edit(driverToEdit: Driver) {
    let modalRef$: Observable<ModalRef>;
    switch (driverToEdit.provider) {
      case 'brave':
      case 'tavily':
      case 'perplexity':
      case 'google':
        modalRef$ = of(
          this.modal.openModal(
            InternetDriverModalComponent,
            new ModalConfig({ data: { driver: driverToEdit, driverList: this.drivers() } }),
          ),
        );
        break;
      case 'cypher':
        modalRef$ = of(this.modal.openModal(CypherDriverModalComponent, new ModalConfig({ data: driverToEdit })));
        break;
      case 'nucliadb':
        modalRef$ = this.sdk.kbList.pipe(
          take(1),
          map((kbList) =>
            this.modal.openModal(
              NucliaDriverModalComponent,
              new ModalConfig({ data: { kbList, driver: driverToEdit } }),
            ),
          ),
        );
        break;
      case 'sql':
        modalRef$ = of(this.modal.openModal(SqlDriverModalComponent, new ModalConfig({ data: driverToEdit })));
        break;
      case 'mcpsse':
        modalRef$ = of(this.modal.openModal(McpSseDriverModalComponent, new ModalConfig({ data: driverToEdit })));
        break;
      case 'mcpstdio':
        modalRef$ = of(this.modal.openModal(McpStdioDriverModalComponent, new ModalConfig({ data: driverToEdit })));
        break;
      case 'alinia':
        modalRef$ = of(this.modal.openModal(GuardrailsDriverModalComponent, new ModalConfig({ data: driverToEdit })));
        break;
    }
    modalRef$
      .pipe(
        switchMap((modalRef) => modalRef.onClose),
        filter((driver) => !!driver),
        switchMap((driver) =>
          this.sdk.currentArag.pipe(
            take(1),
            // edition modal doesn't return identifiers properties, but they are present in driverToEdit
            switchMap((arag) => arag.patchDriver({ ...driverToEdit, ...driver })),
          ),
        ),
        switchMap(() => this.sdk.refreshCurrentArag()),
      )
      .subscribe({
        error: () => {
          this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.edition'));
        },
      });
  }

  deleteDriver(driver: Driver) {
    this.modal
      .openConfirm({
        title: this.translate.instant('retrieval-agents.drivers.confirm-deletion.title', { name: driver.name }),
        description: this.translate.instant('retrieval-agents.drivers.confirm-deletion.description'),
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() =>
          this.sdk.currentArag.pipe(
            take(1),
            switchMap((arag) => arag.deleteDriver(driver.id)),
          ),
        ),
        switchMap(() => this.sdk.refreshCurrentArag()),
      )
      .subscribe({
        error: () => {
          this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.deletion'));
        },
      });
  }
}
