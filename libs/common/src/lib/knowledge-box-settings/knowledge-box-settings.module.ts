import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnowledgeBoxSettingsComponent } from './knowledge-box-settings.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaExpanderModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { LearningOptionPipe } from '../pipes';

@NgModule({
  declarations: [KnowledgeBoxSettingsComponent],
  exports: [KnowledgeBoxSettingsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaExpanderModule,
    LearningOptionPipe,
  ],
})
export class KnowledgeBoxSettingsModule {}
