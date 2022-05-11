import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { STFCheckboxModule } from '@flaps/common';
import { STFButtonsModule, STFInputModule } from '@flaps/pastanaga';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectorsModule } from '../connectors/connectors.module';

import { UploadComponent } from './upload.component';

@NgModule({
  imports: [
    RouterModule,
    CommonModule,
    STFInputModule,
    STFButtonsModule,
    TranslateModule,
    STFCheckboxModule,
    ConnectorsModule,
  ],
  exports: [],
  declarations: [UploadComponent],
  providers: [],
})
export class UploadModule {}
