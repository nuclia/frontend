import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaModalModule,
  PaTableModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { BadgeComponent, ButtonMiniComponent } from '@nuclia/sistema';

import { KnowledgeBoxSettingsComponent } from '../knowledge-box-settings.component';
import { KbSettingsLayoutComponent } from './kb-settings-layout/kb-settings-layout.component';
import { KvSchemasComponent } from './kv-schemas.component';
import { SchemaFormComponent } from './schema-form/schema-form.component';
import { SchemaEditModalComponent } from './schema-edit-modal/schema-edit-modal.component';

const ROUTES: Routes = [
  {
    path: '',
    component: KbSettingsLayoutComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' as const },
      { path: 'general', component: KnowledgeBoxSettingsComponent },
      { path: 'kv-schemas', component: KvSchemasComponent },
    ],
  },
];

@NgModule({
  declarations: [KbSettingsLayoutComponent, KvSchemasComponent, SchemaFormComponent, SchemaEditModalComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule.forChild(),
    RouterModule.forChild(ROUTES),
    KnowledgeBoxSettingsComponent,
    PaButtonModule,
    PaDropdownModule,
    PaModalModule,
    PaTableModule,
    PaTabsModule,
    PaTextFieldModule,
    PaTogglesModule,
    ButtonMiniComponent,
    BadgeComponent,
  ],
  exports: [KbSettingsLayoutComponent],
})
export class KbSettingsModule {}
