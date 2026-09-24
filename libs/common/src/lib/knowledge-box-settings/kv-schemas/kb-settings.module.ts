import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {
  PaButtonModule,
  PaDropdownModule,
  PaModalModule,
  PaTableModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent, ButtonMiniComponent } from '@nuclia/sistema';

import { KnowledgeBoxSettingsComponent } from '../knowledge-box-settings.component';
import { KbSettingsLayoutComponent } from './kb-settings-layout/kb-settings-layout.component';
import { KvSchemasComponent } from './kv-schemas.component';
import { SchemaEditModalComponent } from './schema-edit-modal/schema-edit-modal.component';
import { SchemaFormComponent } from './schema-form/schema-form.component';

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
    KbSettingsLayoutComponent,
    KvSchemasComponent,
    SchemaFormComponent,
    SchemaEditModalComponent,
  ],
  exports: [KbSettingsLayoutComponent],
})
export class KbSettingsModule {}
