import { NgModule } from '@angular/core';

import { ConnectorsComponent } from './connectors.component';
import { ConnectorComponent } from './connector/connector.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaCardModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { FolderUploadModule } from './folder-upload/folder-upload.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PaTextFieldModule,
    PaButtonModule,
    FolderUploadModule,
    TranslateModule,
    PaCardModule,
    PaTooltipModule,
    PaIconModule,
    PaTogglesModule,
  ],
  exports: [ConnectorsComponent],
  declarations: [ConnectorsComponent, ConnectorComponent],
  providers: [],
})
export class ConnectorsModule {}
