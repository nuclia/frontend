import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FileUploadModule, STFPipesModule } from '@flaps/core';

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
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisProgressModule } from '@nuclia/sistema';
import { HintModule } from '../hint';
import { LabelModule } from '../label';
import { UploadBarComponent } from './upload-bar/upload-bar.component';
import { ProgressBarModule } from '../progress-bar';

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
    ProgressBarModule,
    PaModalModule,
  ],
  declarations: [
    CreateLinkComponent,
    CsvSelectComponent,
    UploadBarComponent,
    UploadFilesComponent,
    UploadFilesDialogComponent,
    UploadProgressComponent,
    UploadProgressDialogComponent,
    UploadTextComponent,
  ],
  exports: [UploadBarComponent],
})
export class UploadModule {}
