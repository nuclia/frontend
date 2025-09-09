import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaIconModule,
  PaModalModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  BackButtonComponent,
  DropdownButtonComponent,
  SisLabelModule,
  SisPasswordInputModule,
  SisProgressModule,
  SisSearchInputComponent,
} from '@nuclia/sistema';
import { PaDemoModule } from '../../../../../libs/pastanaga-angular/projects/demo/src';
import {
  DialogExampleComponent,
  ModalExampleComponent,
  SistemaConfirmationDialogComponent,
  SistemaIconsComponent,
  SistemaModalComponent,
  SistemaScrollbarComponent,
  SistemaToastComponent,
} from './pastanaga-pages-override';
import { SistemaBackButtonComponent } from './sistema-back-button/sistema-back-button.component';
import { SistemaDropdownButtonComponent } from './sistema-dropdown-button/sistema-dropdown-button.component';
import { SistemaLabelComponent } from './sistema-label/sistema-label.component';
import { SistemaPasswordInputComponent } from './sistema-password-input/sistema-password-input.component';
import { SistemaSearchInputComponent } from './sistema-search-input/sistema-search-input.component';
import { SistemaSpinnerComponent } from './sistema-spinner/sistema-spinner.component';

@NgModule({
  declarations: [
    DialogExampleComponent,
    ModalExampleComponent,
    SistemaIconsComponent,
    SistemaModalComponent,
    SistemaScrollbarComponent,
    SistemaLabelComponent,
    SistemaToastComponent,
    SistemaConfirmationDialogComponent,
    SistemaBackButtonComponent,
    SistemaDropdownButtonComponent,
    SistemaPasswordInputComponent,
    SistemaSearchInputComponent,
    SistemaSpinnerComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,

    PaButtonModule,
    PaChipsModule,
    PaDemoModule,
    PaDropdownModule,
    PaIconModule,
    PaModalModule,
    PaScrollModule,
    PaTableModule,
    PaTextFieldModule,
    PaTogglesModule,

    BackButtonComponent,
    DropdownButtonComponent,
    SisPasswordInputModule,
    SisSearchInputComponent,
    SisProgressModule,
    ReactiveFormsModule,
    SisLabelModule,
    TranslateModule.forRoot(),
  ],
  exports: [SistemaSpinnerComponent],
})
export class SistemaPagesModule {}
