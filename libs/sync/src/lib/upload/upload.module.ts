import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectorsModule } from '../connectors/connectors.module';
import { UploadComponent } from './upload.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectFilesComponent } from './select-files/select-files.component';
import { SettingsComponent } from './settings/settings.component';
import { LabelsExpanderComponent, SisProgressModule } from '@nuclia/sistema';
import {
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { LabelModule } from '@flaps/core';

@NgModule({
  imports: [
    RouterModule,
    CommonModule,
    TranslateModule,
    ConnectorsModule,
    FormsModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    PaButtonModule,
    PaTogglesModule,
    PaTooltipModule,
    PaIconModule,
    SisProgressModule,
    LabelModule,
    LabelsExpanderComponent,
  ],
  exports: [],
  declarations: [UploadComponent, SelectFilesComponent, SettingsComponent],
  providers: [],
})
export class UploadModule {}
