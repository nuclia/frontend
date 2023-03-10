import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectorsModule } from '../connectors/connectors.module';
import { ConfirmFilesModule } from './confirm-files/confirm-files.module';

import { UploadComponent } from './upload.component';
import { FormsModule } from '@angular/forms';
import { SelectFilesComponent } from './select-files/select-files.component';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

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
    PaIconModule,
  ],
  exports: [],
  declarations: [UploadComponent, SelectFilesComponent],
  providers: [],
})
export class UploadModule {}
