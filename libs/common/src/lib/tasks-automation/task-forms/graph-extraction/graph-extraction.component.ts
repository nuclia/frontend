import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { LabelingConfigurationComponent } from '../labeling-configuration/labeling-configuration.component';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { TaskRouteDirective } from '../task-route.directive';
import { PaButtonModule, PaIconModule, PaPopupModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GraphOperation, TaskApplyTo } from '@nuclia/core';
import { TasksAutomationService } from '../../tasks-automation.service';
import { take } from 'rxjs';
import { STFUtils } from '@flaps/core';

@Component({
  selector: 'stf-graph-extraction',
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    LabelingConfigurationComponent,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaIconModule,
    ReactiveFormsModule,
    PaButtonModule,
    PaTextFieldModule,
    PaPopupModule,
  ],
  templateUrl: './graph-extraction.component.html',
  styleUrl: './graph-extraction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphExtractionComponent extends TaskRouteDirective implements OnInit {
  private taskAutomation = inject(TasksAutomationService);

  graphForm = new FormGroup({
    entity_defs: new FormArray<FormGroup<{ label: FormControl<string>; description: FormControl<string> }>>([
      new FormGroup({
        label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        description: new FormControl<string>('', { nonNullable: true }),
      }),
    ]),
    entity_examples: new FormArray<
      FormGroup<{ name: FormControl<string>; label: FormControl<string>; example: FormControl<string> }>
    >([]),
    relation_examples: new FormArray<
      FormGroup<{
        source: FormControl<string>;
        target: FormControl<string>;
        label: FormControl<string>;
        example: FormControl<string>;
      }>
    >([]),
  });

  get validForm() {
    return this.graphForm.valid;
  }

  get entityTypeControls() {
    return this.graphForm.controls.entity_defs.controls;
  }

  get exampleControls() {
    return this.graphForm.controls.entity_examples.controls;
  }

  get relationExampleControls() {
    return this.graphForm.controls.relation_examples.controls;
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
    this.graphForm.controls.entity_examples.push(
      new FormGroup({
        name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        example: new FormControl<string>('', { nonNullable: true }),
      }),
    );
  }

  removeExample(index: number) {
    this.graphForm.controls.entity_examples.removeAt(index);
  }

  addRelationExample() {
    this.graphForm.controls.relation_examples.push(
      new FormGroup({
        source: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        target: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        example: new FormControl<string>('', { nonNullable: true }),
      }),
    );
  }

  removeRelationExample(index: number) {
    this.graphForm.controls.relation_examples.removeAt(index);
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    const graphOperation: GraphOperation = {
      ...this.graphForm.getRawValue(),
      ident: `${STFUtils.generateSlug(commonConfig.name)}_${STFUtils.generateRandomSlugSuffix()}`,
    };
    this.taskAutomation
      .startTask(
        'llm-graph',
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: commonConfig.llm,
          operations: [{ graph: graphOperation }],
          on: TaskApplyTo.FULL_FIELD,
        },
        commonConfig.applyTaskTo,
      )
      .subscribe(() => {
        this.backToTaskList();
      });
  }

  ngOnInit() {
    this.task?.pipe(take(1)).subscribe((task) => {
      const graphOperation = task?.parameters.operations?.find((operation) => !!operation.graph)?.graph;
      if (graphOperation) {
        this.graphForm.controls.entity_defs.clear();
        this.graphForm.controls.entity_examples.clear();
        this.graphForm.controls.relation_examples.clear();
        graphOperation.entity_defs?.forEach(() => this.addNerType());
        graphOperation.entity_examples?.forEach(() => this.addExample());
        graphOperation.relation_examples?.forEach(() => this.addRelationExample());
        this.graphForm.patchValue(graphOperation);
        this.graphForm.disable();
      }
    });
  }
}
