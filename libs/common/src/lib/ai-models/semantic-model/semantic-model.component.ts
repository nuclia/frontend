import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StickyFooterComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of, switchMap, tap } from 'rxjs';

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
    StickyFooterComponent,
    PaButtonModule,
  ],
  templateUrl: './semantic-model.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemanticModelComponent extends LearningConfigurationDirective {
  configForm = new FormGroup({
    default_semantic_model: new FormControl<string>('', { nonNullable: true }),
  });

  semanticModels: string[] = [];
  semanticModelsName: { [value: string]: string } = {};

  get defaultModelControl() {
    return this.configForm.controls.default_semantic_model;
  }

  get defaultModel() {
    return this.configForm.controls.default_semantic_model.value;
  }

  get defaultModelBackup() {
    return this.kbConfigBackup?.['default_semantic_model'];
  }

  protected resetForm(): void {
    if (this.learningConfigurations) {
      this.semanticModelsName = (this.learningConfigurations['default_semantic_model'].options || []).reduce(
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
      this.defaultModelControl.patchValue(kbConfig['default_semantic_model']);
      setTimeout(() => {
        this.configForm.markAsPristine();
        this.cdr.markForCheck();
      });
    }
  }

  protected save() {
    if (!this.kb) {
      return;
    }

    this.saving = true;
    const kbCofig = this.configForm.getRawValue();
    this.kb
      .setConfiguration(kbCofig)
      .pipe(
        tap(() => this.toaster.success(this.translate.instant('kb.ai-models.toasts.success'))),
        catchError(() => {
          this.toaster.error(this.translate.instant('kb.ai-models.toasts.failure'));
          return of(undefined);
        }),
        switchMap(() => this.sdk.refreshCurrentKb()),
      )
      .subscribe(() => {
        this.configForm.markAsPristine();
        this.saving = false;
      });
  }
}
