import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { STFButtonsModule } from '@flaps/pastanaga';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmFilesComponent } from './confirm-files.component';
import { PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, STFButtonsModule, MatDialogModule, TranslateModule, PaTooltipModule],
  exports: [],
  declarations: [ConfirmFilesComponent],
  providers: [],
})
export class ConfirmFilesModule {}
