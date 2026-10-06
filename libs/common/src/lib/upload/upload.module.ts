import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ExtractionSelectComponent, LabelModule, ResourceHandlingBannerComponent, STFPipesModule } from '@flaps/core';
import {
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaModalModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent, InfoCardComponent, ProgressBarComponent } from '@nuclia/sistema';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CreateLinkComponent } from './create-link/create-link.component';
import { CsvSelectComponent } from './csv-select/csv-select.component';
import { UploadBarComponent } from './upload-bar/upload-bar.component';
import { DesktopSourcesComponent } from './upload-data/desktop-sources/desktop-sources.component';
import { UploadDataComponent } from './upload-data/upload-data.component';
import { UploadOptionComponent } from './upload-data/upload-option/upload-option.component';
import { UploadFilesDialogComponent } from './upload-files/upload-files-dialog.component';
import { UploadFilesComponent } from './upload-files/upload-files.component';
import { UploadProgressDialogComponent } from './upload-progress/upload-progress-dialog.component';
import { UploadProgressComponent } from './upload-progress/upload-progress.component';
import { UploadQnaComponent } from './upload-qna/upload-qna.component';
import { UploadRoutingModule } from './upload-routing.module';
import { UploadTextComponent } from './upload-text/upload-text.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    STFPipesModule,
    LabelModule,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    PaTooltipModule,
    PaTextFieldModule,
    PaModalModule,
    PaTableModule,
    PaExpanderModule,
    ProgressBarComponent,
    UploadRoutingModule,
    UploadBarComponent,
    CsvSelectComponent,
    InfoCardComponent,
    BadgeComponent,
    ExtractionSelectComponent,
    ResourceHandlingBannerComponent,
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
  ],
  exports: [
    UploadBarComponent,
    CsvSelectComponent,
    UploadDataComponent,
    DesktopSourcesComponent,
    UploadOptionComponent,
  ],
})
export class UploadModule {}
