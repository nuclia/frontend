import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import {
  ModalConfig,
  ModalRef,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Driver } from '@nuclia/core';
import { DropdownButtonComponent, InfoCardComponent, SisModalService, SisToastService } from '@nuclia/sistema';
import { catchError, filter, map, Observable, of, Subject, switchMap, take, takeUntil, tap, throwError } from 'rxjs';
import { CypherDriverModalComponent } from './cypher-driver';
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

  addDriver(type: 'nuclia' | 'internet' | 'sql' | 'cypher' | 'mcpsse' | 'mcpstdio') {
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
    }
    modalRef$
      .pipe(
        switchMap((modalRef) => modalRef.onClose),
        filter((driver) => !!driver),
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

  edit(driver: Driver) {
    const driverId = driver.id;
    let modalRef$: Observable<ModalRef>;
    switch (driver.provider) {
      case 'brave':
      case 'tavily':
      case 'perplexity':
      case 'google':
        modalRef$ = of(
          this.modal.openModal(
            InternetDriverModalComponent,
            new ModalConfig({ data: { driver, driverList: this.drivers() } }),
          ),
        );
        break;
      case 'cypher':
        modalRef$ = of(this.modal.openModal(CypherDriverModalComponent, new ModalConfig({ data: driver })));
        break;
      case 'nucliadb':
        modalRef$ = this.sdk.kbList.pipe(
          map((kbList) =>
            this.modal.openModal(NucliaDriverModalComponent, new ModalConfig({ data: { kbList, driver } })),
          ),
        );
        break;
      case 'sql':
        modalRef$ = of(this.modal.openModal(SqlDriverModalComponent, new ModalConfig({ data: driver })));
        break;
      case 'mcpsse':
        modalRef$ = of(this.modal.openModal(McpSseDriverModalComponent, new ModalConfig({ data: driver })));
        break;
      case 'mcpstdio':
        modalRef$ = of(this.modal.openModal(McpStdioDriverModalComponent, new ModalConfig({ data: driver })));
        break;
    }
    modalRef$
      .pipe(
        switchMap((modalRef) => modalRef.onClose),
        filter((driver) => !!driver),
        switchMap((driver) =>
          this.sdk.currentArag.pipe(
            take(1),
            switchMap((arag) => arag.patchDriver({ id: driverId, ...driver })),
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
