import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LearningConfigurationDirective } from '../learning-configuration.directive';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  InfoCardComponent,
  ProgressBarComponent,
  StickyFooterComponent,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, map, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { LearningConfigurationOption, SemanticModelMigration, TaskOnBatch } from '@nuclia/core';
import { StandaloneService } from '../../services';

interface SemanticModelMigrationTask extends TaskOnBatch {
  parameters: SemanticModelMigration;
}

const HUGGING_FACE_MODEL = 'hf_embedding';

@Component({
  selector: 'stf-semantic-model',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    PaTextFieldModule,
    TranslateModule,
    PaTogglesModule,
    StickyFooterComponent,
    PaButtonModule,
    InfoCardComponent,
    ProgressBarComponent,
  ],
  templateUrl: './semantic-model.component.html',
  styleUrl: './semantic-model.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SemanticModelComponent extends LearningConfigurationDirective {
  configForm = new FormGroup({
    default_semantic_model: new FormControl<string>('', { nonNullable: true }),
  });

  semanticModels: string[] = [];
  semanticModelsName: { [value: string]: string } = {};
  otherModels: LearningConfigurationOption[] = [];
  activeMigration?: SemanticModelMigrationTask;
  updateModelsSubject = new Subject<void>();
  standalone = this.standaloneService.standalone;
  unsubscribeAll = new Subject<void>();

  get defaultModelControl() {
    return this.configForm.controls.default_semantic_model;
  }

  get defaultModel() {
    return this.configForm.controls.default_semantic_model.value;
  }

  get defaultModelBackup() {
    return this.kbConfigBackup?.['default_semantic_model'];
  }

  constructor(private standaloneService: StandaloneService) {
    super();
    this.updateModelsSubject
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap(() => this.getActiveMigration()),
      )
      .subscribe((activeMigration) => {
        this.updateModels(activeMigration);
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  protected resetForm(): void {
    this.updateModelsSubject.next();
  }

  updateModels(activeMigration?: SemanticModelMigrationTask) {
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
      this.activeMigration = activeMigration;
      const migrationModel = activeMigration?.parameters.semantic_model_id;
      this.semanticModels = kbConfig['semantic_models'].filter((model: string) => migrationModel !== model);
      this.defaultModelControl.patchValue(kbConfig['default_semantic_model']);
      this.otherModels = (this.learningConfigurations?.['semantic_models'].options || []).filter(
        (option) =>
          (!this.semanticModels.includes(option.value) || option.value === migrationModel) &&
          option.value !== HUGGING_FACE_MODEL, // At the moment backend does not allow to add a Hugging face semantic model
      );
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

  enable(model: string) {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb
            .addVectorset(model)
            .pipe(switchMap(() => kb.taskManager.startTask('semantic-model-migrator', { semantic_model_id: model }))),
        ),
        catchError(() => {
          this.toaster.error(this.translate.instant('kb.ai-models.semantic-model.other-models.failure'));
          return of(undefined);
        }),
        map(() => undefined),
      )
      .subscribe(() => {
        this.updateModelsSubject.next();
      });
  }

  cancel(model: string, taskId: string) {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.removeVectorset(model).pipe(
            switchMap(() => this.sdk.refreshCurrentKb()),
            switchMap(() => kb.taskManager.stopTask(taskId)),
            switchMap(() => kb.taskManager.deleteTask(taskId)),
          ),
        ),
      )
      .subscribe(() => {
        this.updateModelsSubject.next();
      });
  }

  getActiveMigration() {
    if (this.standalone) {
      return of(undefined);
    }
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.getTasks()),
      map((tasks) => tasks.running.find((task) => task.task.name === 'semantic-model-migrator')),
      map((tasks) => tasks as SemanticModelMigrationTask | undefined),
    );
  }
}
