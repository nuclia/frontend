import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
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
import {
  DropdownButtonComponent,
  InfoCardComponent,
  SisModalService,
  SisToastService,
  StickyFooterComponent,
} from '@nuclia/sistema';
import { catchError, filter, Observable, of, Subject, switchMap, takeUntil, throwError } from 'rxjs';
import { CypherDriverModalComponent } from './cypher-driver';
import { InternetDriverModalComponent } from './internet-driver';
import { McpDriverModalComponent } from './mcp-driver';
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
    StickyFooterComponent,
    TranslateModule,
  ],
  templateUrl: './drivers-page.component.html',
  styleUrl: './drivers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversPageComponent implements OnDestroy {
  private sdk = inject(SDKService);
  private modal = inject(SisModalService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);

  private _unsubscribeAll = new Subject<void>();

  drivers$: Observable<Driver[]> = this.sdk.currentArag.pipe(
    switchMap((arag) => arag.getDrivers()),
    catchError((error) => {
      if (error.status === 404) {
        return of([]);
      } else {
        return throwError(() => error);
      }
    }),
    takeUntil(this._unsubscribeAll),
  );

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  addDriver(type: 'nuclia' | 'internet' | 'sql' | 'cypher' | 'mcp') {
    let modalRef: ModalRef;
    switch (type) {
      case 'nuclia':
        modalRef = this.modal.openModal(NucliaDriverModalComponent);
        break;
      case 'internet':
        modalRef = this.modal.openModal(InternetDriverModalComponent);
        break;
      case 'sql':
        modalRef = this.modal.openModal(SqlDriverModalComponent);
        break;
      case 'cypher':
        modalRef = this.modal.openModal(CypherDriverModalComponent);
        break;
      case 'mcp':
        modalRef = this.modal.openModal(McpDriverModalComponent);
        break;
    }
    modalRef.onClose
      .pipe(
        filter((driver) => !!driver),
        switchMap((driver) => this.sdk.currentArag.pipe(switchMap((arag) => arag.addDriver(driver)))),
      )
      .subscribe({
        next: () => {
          this.sdk.refreshCurrentArag();
        },
        error: () => {
          this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.creation'));
        },
      });
  }

  edit(driver: Driver) {
    let modalRef: ModalRef;
    switch (driver.provider) {
      case 'brave':
      case 'tavily':
      case 'perplexity':
        modalRef = this.modal.openModal(InternetDriverModalComponent, new ModalConfig({ data: driver }));
        break;
      case 'cypher':
        modalRef = this.modal.openModal(CypherDriverModalComponent, new ModalConfig({ data: driver }));
        break;
      case 'nucliadb':
        modalRef = this.modal.openModal(NucliaDriverModalComponent, new ModalConfig({ data: driver }));
        break;
      case 'sql':
        modalRef = this.modal.openModal(SqlDriverModalComponent, new ModalConfig({ data: driver }));
        break;
      case 'mcp':
        modalRef = this.modal.openModal(McpDriverModalComponent, new ModalConfig({ data: driver }));
        break;
    }
    modalRef.onClose
      .pipe(
        filter((driver) => !!driver),
        switchMap((driver) => this.sdk.currentArag.pipe(switchMap((arag) => arag.patchDriver(driver)))),
      )
      .subscribe({
        next: () => {
          this.sdk.refreshCurrentArag();
        },
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
        switchMap(() => this.sdk.currentArag.pipe(switchMap((arag) => arag.deleteDriver(driver.id)))),
      )
      .subscribe({
        next: () => {
          this.sdk.refreshCurrentArag();
        },
        error: () => {
          this.toaster.error(this.translate.instant('retrieval-agents.drivers.errors.deletion'));
        },
      });
  }
}
