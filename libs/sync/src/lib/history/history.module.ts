import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProgressBarModule } from '@flaps/common';
import { TranslateModule } from '@ngx-translate/core';

import { HistoryComponent } from './history.component';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaIconModule,
  PaTableModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent } from '@nuclia/sistema';

@NgModule({
  imports: [
    BackButtonComponent,
    CommonModule,
    RouterModule,
    TranslateModule,
    ProgressBarModule,
    PaButtonModule,
    PaIconModule,
    PaTableModule,
    PaTooltipModule,
    PaDateTimeModule,
  ],
  exports: [],
  declarations: [HistoryComponent],
  providers: [],
})
export class HistoryModule {}
