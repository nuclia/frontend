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
  CountrySelectComponent,
  DropdownButtonComponent,
  NsiSkeletonComponent,
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
import { SistemaCountrySelectComponent } from './sistema-country-select/sistema-country-select.component';
import { SistemaSearchInputComponent } from './sistema-search-input/sistema-search-input.component';
import { SistemaSkeletonComponent } from './sistema-skeleton/sistema-skeleton.component';
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
    SistemaCountrySelectComponent,
    SistemaDropdownButtonComponent,
    SistemaPasswordInputComponent,
    SistemaSearchInputComponent,
    SistemaSkeletonComponent,
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
    CountrySelectComponent,
    DropdownButtonComponent,
    NsiSkeletonComponent,
    SisPasswordInputModule,
    SisSearchInputComponent,
    SisProgressModule,
    ReactiveFormsModule,
    SisLabelModule,
    TranslateModule.forRoot(),
  ],
  exports: [SistemaSkeletonComponent, SistemaSpinnerComponent],
})
export class SistemaPagesModule {}
