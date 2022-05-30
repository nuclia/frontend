import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { STFCheckboxModule } from '@flaps/common';
import { STFButtonsModule, STFInputModule } from '@flaps/pastanaga';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectorsModule } from '../connectors/connectors.module';
import { ConfirmFilesModule } from './confirm-files/confirm-files.module';

import { StepsComponent } from './steps/steps.component';
import { UploadComponent } from './upload.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    RouterModule,
    CommonModule,
    STFButtonsModule,
    MatDialogModule,
    TranslateModule,
    STFCheckboxModule,
    ConnectorsModule,
    ConfirmFilesModule,
    FormsModule,
  ],
  exports: [],
  declarations: [UploadComponent, StepsComponent],
  providers: [],
})
export class UploadModule {}
