import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HistoryComponent } from './history.component';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaIconModule,
  PaTableModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent, ProgressBarComponent } from '@nuclia/sistema';

@NgModule({
  imports: [
    BackButtonComponent,
    CommonModule,
    RouterModule,
    TranslateModule,
    PaButtonModule,
    PaIconModule,
    PaTableModule,
    PaTooltipModule,
    PaDateTimeModule,
    ProgressBarComponent,
  ],
  exports: [],
  declarations: [HistoryComponent],
  providers: [],
})
export class HistoryModule {}
