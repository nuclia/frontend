import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
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
    PaTogglesModule,
  ],
  templateUrl: './semantic-model.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemanticModelComponent extends LearningConfigurationDirective {
  configForm = new FormGroup({
    semanticModel: new FormControl<string>('', { nonNullable: true }),
  });

  semanticModels: string[] = [];
  semanticModelsName: { [value: string]: string } = {};

  get semanticModelControl() {
    return this.configForm.controls.semanticModel;
  }

  protected resetForm(): void {
    if (this.learningConfigurations) {
      this.semanticModelsName = (this.learningConfigurations['semantic_models'].options || []).reduce(
        (names, model) => {
          names[model.value] = model.name;
          return names;
        },
        {} as { [value: string]: string },
      );
    }

    const kbConfig = this.kbConfigBackup;
    if (kbConfig) {
      this.semanticModels = kbConfig['semantic_models'];
      this.semanticModelControl.patchValue(kbConfig['semantic_model']);
      this.configForm.disable();
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
