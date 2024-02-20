import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FileUploadModule, STFPipesModule, LabelModule } from '@flaps/core';

import { CreateLinkComponent } from './create-link/create-link.component';
import { CsvSelectComponent } from './csv-select/csv-select.component';
import { UploadFilesComponent } from './upload-files/upload-files.component';
import { UploadFilesDialogComponent } from './upload-files/upload-files-dialog.component';
import { UploadProgressComponent } from './upload-progress/upload-progress.component';
import { UploadProgressDialogComponent } from './upload-progress/upload-progress-dialog.component';
import { UploadTextComponent } from './upload-text/upload-text.component';
import {
  PaButtonModule,
  PaIconModule,
  PaModalModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { ProgressBarComponent, SisProgressModule } from '@nuclia/sistema';
import { HintModule } from '../hint/hint.module';
import { UploadBarComponent } from './upload-bar/upload-bar.component';
import { UploadQnaComponent } from './upload-qna/upload-qna.component';
import { UploadDataComponent } from './upload-data/upload-data.component';
import { UploadOptionComponent } from './upload-data/upload-option/upload-option.component';
import { DesktopSourcesComponent } from './upload-data/desktop-sources/desktop-sources.component';
import { UploadLayoutComponent } from './upload-data/upload-layout.component';
import { UploadRoutingModule } from './upload-routing.module';
import { SyncModule } from 'libs/sync/src/lib/new-sync.module';
import { ConnectorsModule } from 'libs/sync/src/lib/connectors/connectors.module';
import { SyncService } from '@nuclia/sync';
import { NewSyncService } from '../../../../sync/src/lib/sync/new-sync.service';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    FileUploadModule,
    STFPipesModule,
    LabelModule,
    HintModule,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    PaTooltipModule,
    PaTextFieldModule,
    SisProgressModule,
    PaModalModule,
    PaTableModule,
    ProgressBarComponent,
    UploadRoutingModule,
    ConnectorsModule,
    SyncModule,
    UploadBarComponent,
    CsvSelectComponent,
  ],
  declarations: [
    CreateLinkComponent,
    UploadFilesComponent,
    UploadFilesDialogComponent,
    UploadProgressComponent,
    UploadProgressDialogComponent,
    UploadTextComponent,
    UploadQnaComponent,
    UploadDataComponent,
    UploadOptionComponent,
    DesktopSourcesComponent,
    UploadLayoutComponent,
  ],
  exports: [
    UploadBarComponent,
    CsvSelectComponent,
    UploadDataComponent,
    DesktopSourcesComponent,
    UploadOptionComponent,
    UploadLayoutComponent,
  ],
  providers: [
    // TO BE REMOVED WHEN DESKTOP APP IS GONE
    // override SyncService with NewSyncService to use the new agent API
    { provide: SyncService, useClass: NewSyncService },
  ],
})
export class UploadModule {}
