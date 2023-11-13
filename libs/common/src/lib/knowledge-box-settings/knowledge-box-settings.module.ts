import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnowledgeBoxSettingsComponent } from './knowledge-box-settings.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { LearningOptionPipe } from './learning-option.pipe';

@NgModule({
  declarations: [KnowledgeBoxSettingsComponent, LearningOptionPipe],
  exports: [KnowledgeBoxSettingsComponent, LearningOptionPipe],
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaButtonModule, PaTextFieldModule, PaTogglesModule],
})
export class KnowledgeBoxSettingsModule {}
