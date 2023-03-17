import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectorsModule } from '../connectors/connectors.module';

import { UploadComponent } from './upload.component';
import { FormsModule } from '@angular/forms';
import { SelectFilesComponent } from './select-files/select-files.component';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [
    RouterModule,
    CommonModule,
    TranslateModule,
    ConnectorsModule,
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
