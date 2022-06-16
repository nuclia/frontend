import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SistemaPaletteComponent } from './sistema-palette/sistema-palette.component';
import { PaDemoModule } from '../../../../../libs/pastanaga-angular/projects/demo/src';
import { SistemaIconsComponent } from './sistema-icons/sistema-icons.component';
import {
  PaButtonModule,
  PaChipsModule,
  PaDropdownModule,
  PaIconModule,
  PaModalModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { FormsModule } from '@angular/forms';
import { SistemaTableComponent } from './sistema-tables/sistema-table.component';
import { SistemaScrollbarComponent } from './sistema-scrollbar/sistema-scrollbar.component';
import { SistemaLabelComponent } from './sistema-label/sistema-label.component';
import { RouterModule } from '@angular/router';
import { DialogExampleComponent, ModalExampleComponent, SistemaModalComponent } from './sistema-modal';

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
  ],
})
export class SistemaPagesModule {}
