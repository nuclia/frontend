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
import { FormsModule } from '@angular/forms';
import { SistemaLabelComponent } from './sistema-label/sistema-label.component';
import { RouterModule } from '@angular/router';
import {
  DialogExampleComponent,
  ModalExampleComponent,
  SistemaButtonsComponent,
  SistemaConfirmationDialogComponent,
  SistemaIconsComponent,
  SistemaModalComponent,
  SistemaPaletteComponent,
  SistemaScrollbarComponent,
  SistemaTableComponent,
  SistemaToastComponent,
} from './pastanaga-pages-override';

@NgModule({
  declarations: [
    DialogExampleComponent,
    ModalExampleComponent,
    SistemaIconsComponent,
    SistemaModalComponent,
    SistemaPaletteComponent,
    SistemaScrollbarComponent,
    SistemaTableComponent,
    SistemaLabelComponent,
    SistemaButtonsComponent,
    SistemaToastComponent,
    SistemaConfirmationDialogComponent,
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
  ],
})
export class SistemaPagesModule {}
