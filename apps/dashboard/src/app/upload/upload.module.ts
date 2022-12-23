import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { STFFormDirectivesModule, STFTooltipModule } from '@flaps/pastanaga';
import { FileUploadModule, STFPipesModule } from '@flaps/core';

import { CreateLinkComponent } from './create-link/create-link.component';
import { UploadFilesComponent } from './upload-files/upload-files.component';
import { UploadFilesDialogComponent } from './upload-files/upload-files-dialog.component';
import { UploadProgressComponent } from './upload-progress/upload-progress.component';
import { UploadProgressDialogComponent } from './upload-progress/upload-progress-dialog.component';
import { UploadTextComponent } from './upload-text/upload-text.component';
import { LabelModule } from '../components/label/label.module';
import { HintModule } from '../components/hint/hint.module';
import {
  PaButtonModule,
  PaIconModule,
  PaTogglesModule,
  PaTooltipModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisProgressModule } from '@nuclia/sistema';

const Components = [
  CreateLinkComponent,
  UploadFilesComponent,
  UploadFilesDialogComponent,
  UploadProgressComponent,
  UploadProgressDialogComponent,
  UploadTextComponent,
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    STFFormDirectivesModule,
    STFTooltipModule,
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
  ],
  declarations: [...Components],
  exports: [],
})
export class UploadModule {}
