import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TaskSettingsComponent } from '../task-settings/task-settings.component';
import { TranslateModule } from '@ngx-translate/core';
import { TaskRouteDirective } from '../task-route.directive';
import {
  PaButtonModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GraphOperation, TaskApplyTo, TaskName } from '@nuclia/core';
import { TasksAutomationService } from '../../tasks-automation.service';
import { STFUtils } from '@flaps/core';
import { map } from 'rxjs';

@Component({
  selector: 'stf-graph-extraction',
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    TaskFormComponent,
    TaskSettingsComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaIconModule,
    ReactiveFormsModule,
    PaButtonModule,
    PaTextFieldModule,
    PaPopupModule,
    PaTableModule,
  ],
  templateUrl: './graph-extraction.component.html',
  styleUrl: './graph-extraction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphExtractionComponent extends TaskRouteDirective {
  private taskAutomation = inject(TasksAutomationService);
  type: TaskName = 'llm-graph';

  graphOperation = this.task.pipe(
    map((task) => task?.parameters?.operations?.find((operation) => operation.graph)?.graph),
  );

  graphForm = new FormGroup({
    entity_defs: new FormArray<FormGroup<{ label: FormControl<string>; description: FormControl<string> }>>([
      new FormGroup({
        label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        description: new FormControl<string>('', { nonNullable: true }),
      }),
    ]),
    examples: new FormArray<
      FormGroup<{
        entities: FormArray<
          FormGroup<{
            name: FormControl<string>;
            label: FormControl<string>;
          }>
        >;
        relations: FormArray<
          FormGroup<{
            source: FormControl<string>;
            target: FormControl<string>;
            label: FormControl<string>;
          }>
        >;
        text: FormControl<string>;
      }>
    >([]),
  });

  get validForm() {
    return this.graphForm.valid;
  }

  get nerTypes() {
    return this.entityTypeControls.map((formGroup) => formGroup.controls.label.value);
  }

  get entityTypeControls() {
    return this.graphForm.controls.entity_defs.controls;
  }

  get examplesControls() {
    return this.graphForm.controls.examples.controls;
  }

  getEntitiesControls(index: number) {
    return this.examplesControls[index].controls.entities.controls;
  }

  getRelationsControls(index: number) {
    return this.examplesControls[index].controls.relations.controls;
  }

  addNerType() {
    this.graphForm.controls.entity_defs.push(
      new FormGroup({
        label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        description: new FormControl<string>('', { nonNullable: true }),
      }),
    );
  }

  removeEntityType(index: number) {
    this.graphForm.controls.entity_defs.removeAt(index);
  }

  addExample() {
    this.graphForm.controls.examples.push(this.initExampleGroup());
  }

  removeExample(index: number) {
    this.graphForm.controls.examples.removeAt(index);
  }

  addEntity(index: number) {
    this.getEntitiesControls(index).push(
      new FormGroup({
        name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      }),
    );
  }

  removeEntity(exampleIndex: number, entityIndex: number) {
    this.examplesControls[exampleIndex].controls.entities.removeAt(entityIndex);
  }

  addRelation(index: number) {
    this.getRelationsControls(index).push(
      new FormGroup({
        source: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        target: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      }),
    );
  }

  removeRelation(exampleIndex: number, relationIndex: number) {
    this.examplesControls[exampleIndex].controls.relations.removeAt(relationIndex);
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    const graphOperation: GraphOperation = {
      ...this.graphForm.getRawValue(),
      ident: `${STFUtils.generateSlug(commonConfig.name)}_${STFUtils.generateRandomSlugSuffix()}`,
      triggers: commonConfig.webhook && [commonConfig.webhook],
    };
    this.taskAutomation
      .startTask(
        this.type,
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: commonConfig.llm,
          operations: [{ graph: graphOperation }],
          on: TaskApplyTo.FULL_FIELD,
        },
        commonConfig.applyTaskTo,
      )
      .subscribe({
        complete: () => this.backToTaskList(),
        error: (error) => this.showError(error),
      });
  }

  private initExampleGroup() {
    return new FormGroup({
      entities: new FormArray<FormGroup<{ name: FormControl<string>; label: FormControl<string> }>>([
        new FormGroup({
          name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
          label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        }),
      ]),
      relations: new FormArray<
        FormGroup<{
          source: FormControl<string>;
          target: FormControl<string>;
          label: FormControl<string>;
        }>
      >([
        new FormGroup({
          source: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
          target: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
          label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        }),
      ]),
      text: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    });
  }
}
