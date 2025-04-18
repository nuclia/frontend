import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SDKService } from '@flaps/core';
import { ModalRef, PaButtonModule, PaDropdownModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Driver } from '@nuclia/core';
import {
  DropdownButtonComponent,
  InfoCardComponent,
  SisModalService,
  SisToastService,
  StickyFooterComponent,
} from '@nuclia/sistema';
import { catchError, filter, Observable, of, switchMap, throwError } from 'rxjs';
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
    DropdownButtonComponent,
    InfoCardComponent,
    StickyFooterComponent,
    TranslateModule,
  ],
  templateUrl: './drivers-page.component.html',
  styleUrl: './drivers-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriversPageComponent {
  private sdk = inject(SDKService);
  private modal = inject(SisModalService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);

  drivers$: Observable<Driver[]> = this.sdk.currentArag.pipe(
    switchMap((arag) => arag.getDrivers()),
    catchError((error) => {
      if (error.status === 404) {
        return of([]);
      } else {
        return throwError(() => error);
      }
    }),
  );

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
}
