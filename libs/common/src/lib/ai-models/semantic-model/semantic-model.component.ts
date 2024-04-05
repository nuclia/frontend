import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'stf-semantic-model',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    PaTextFieldModule,
    TranslateModule,
  ],
  templateUrl: './semantic-model.component.html',
  styleUrl: '../_common-ai-models.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemanticModelComponent extends LearningConfigurationDirective {
  configForm = new FormGroup({
    semanticModel: new FormControl<string>('', { nonNullable: true }),
  });

  get semanticModelControl() {
    return this.configForm.controls.semanticModel;
  }

  protected resetForm(): void {
    const kbConfig = this.kbConfigBackup;
    if (kbConfig) {
      this.semanticModelControl.patchValue(kbConfig['semantic_model']);
      setTimeout(() => {
        this.configForm.markAsPristine();
        this.cdr.markForCheck();
      });
    }
  }

  protected save() {
    // semantic model cannot be changed for now.
  }
}
