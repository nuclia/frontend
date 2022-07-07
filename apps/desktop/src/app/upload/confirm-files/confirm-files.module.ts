import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmFilesComponent } from './confirm-files.component';
import { PaButtonModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, MatDialogModule, TranslateModule, PaTooltipModule, PaButtonModule],
  exports: [],
  declarations: [ConfirmFilesComponent],
  providers: [],
})
export class ConfirmFilesModule {}
