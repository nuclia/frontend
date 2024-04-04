import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaDemoModule } from '../../../../../libs/pastanaga-angular/projects/demo/src';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SistemaLabelComponent } from './sistema-label/sistema-label.component';
import { RouterModule } from '@angular/router';
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
import {
  BackButtonComponent,
  DropdownButtonComponent,
  SisLabelModule,
  SisPasswordInputModule,
  SisProgressModule,
} from '@nuclia/sistema';
import { SistemaDropdownButtonComponent } from './sistema-dropdown-button/sistema-dropdown-button.component';
import { SistemaPasswordInputComponent } from './sistema-password-input/sistema-password-input.component';
import { SistemaSpinnerComponent } from './sistema-spinner/sistema-spinner.component';
import { TranslateModule } from '@ngx-translate/core';

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
    SisProgressModule,
    ReactiveFormsModule,
    SisLabelModule,
    TranslateModule.forRoot(),
  ],
  exports: [SistemaSpinnerComponent],
})
export class SistemaPagesModule {}
