import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { STFButtonsModule } from '@flaps/pastanaga';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmFilesComponent } from './confirm-files.component';

@NgModule({
  imports: [
    CommonModule,
    STFButtonsModule,
    MatDialogModule,
    TranslateModule,
  ],
  exports: [],
  declarations: [ConfirmFilesComponent],
  providers: [],
})
export class ConfirmFilesModule {}
