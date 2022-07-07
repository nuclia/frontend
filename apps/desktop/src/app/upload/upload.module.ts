import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectorsModule } from '../connectors/connectors.module';
import { ConfirmFilesModule } from './confirm-files/confirm-files.module';

import { StepsComponent } from './steps/steps.component';
import { UploadComponent } from './upload.component';
import { FormsModule } from '@angular/forms';
import { SelectFilesComponent } from './select-files/select-files.component';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    RouterModule,
    CommonModule,
    MatDialogModule,
    TranslateModule,
    ConnectorsModule,
    ConfirmFilesModule,
    FormsModule,
    PaTextFieldModule,
    PaButtonModule,
    PaTogglesModule,
  ],
  exports: [],
  declarations: [UploadComponent, StepsComponent, SelectFilesComponent],
  providers: [],
})
export class UploadModule {}
