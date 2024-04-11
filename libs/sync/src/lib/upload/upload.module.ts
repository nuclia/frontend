import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectorsModule } from '../connectors/connectors.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LabelsExpanderComponent, SisProgressModule } from '@nuclia/sistema';
import {
  PaButtonModule,
  PaDatePickerModule,
  PaDateTimeModule,
  PaIconModule,
  PaTableModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { EditableTableComponent, LabelModule } from '@flaps/core';
import { SyncComponent } from './sync.component';
import { EditSyncSettingsComponent } from './tabs/edit-settings.component';
import { EditSyncFoldersComponent } from './tabs/edit-folders.component';
import { EditSyncLabelsComponent } from './tabs/edit-labels.component';
import { AddSyncComponent } from './add-sync.component';
import { SyncActivityComponent } from './tabs/activity.component';
import { EditSyncFiltersComponent } from './tabs/edit-filters.component';

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
    PaTabsModule,
    PaTableModule,
    PaDateTimeModule,
    PaDatePickerModule,
    EditableTableComponent,
  ],
  exports: [],
  declarations: [
    SyncComponent,
    SyncActivityComponent,
    EditSyncSettingsComponent,
    EditSyncFoldersComponent,
    EditSyncLabelsComponent,
    EditSyncFiltersComponent,
    AddSyncComponent,
  ],
  providers: [],
})
export class UploadModule {}
