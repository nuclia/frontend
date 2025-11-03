import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnowledgeBoxSettingsComponent } from './knowledge-box-settings.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaExpanderModule, PaIconModule, PaPopupModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [KnowledgeBoxSettingsComponent],
  exports: [KnowledgeBoxSettingsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaIconModule,
    PaPopupModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaExpanderModule,
  ],
})
export class KnowledgeBoxSettingsModule {}
