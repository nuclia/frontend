import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { TaskRouteDirective } from '../../task-route.directive';
import { PaButtonModule, PaIconModule, PaPopupModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GraphOperation, TaskApplyTo, TaskName } from '@nuclia/core';
import { STFUtils } from '@flaps/core';
import { filter, map, take } from 'rxjs';

@Component({
  selector: 'stf-graph-extraction',
  imports: [
    CommonModule,
    BackButtonComponent,
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
export class GraphExtractionComponent extends TaskRouteDirective {
  type: TaskName = 'llm-graph';

  graphOperation = this.task.pipe(
    map((task) => task?.parameters?.operations?.find((operation) => operation.graph)?.graph),
  );

  graphForm = new FormGroup({
    ident: new FormControl('', { nonNullable: true }),
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

  constructor() {
    super();
    this.graphOperation
      .pipe(
        filter((operation) => !!operation),
        take(1),
      )
      .subscribe((operation) => {
        this.graphForm.controls.entity_defs.clear();
        operation.entity_defs?.forEach(() => {
          this.addNerType();
        });
        operation.examples?.forEach((example, i) => {
          this.addExample(example.entities.length, example.relations.length);
        });
        this.graphForm.patchValue(operation);
      });
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

  addExample(entities: number, relations: number) {
    this.graphForm.controls.examples.push(this.initExampleGroup(entities, relations));
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

  onSave(commonConfig: TaskFormCommonConfig) {
    const values = this.graphForm.getRawValue();
    const graphOperation: GraphOperation = {
      ...values,
      ident: values.ident
        ? values.ident
        : `${STFUtils.generateSlug(commonConfig.name)}_${STFUtils.generateRandomSlugSuffix()}`,
      triggers: commonConfig.webhook && [commonConfig.webhook],
    };
    const parameters = {
      name: commonConfig.name,
      filter: commonConfig.filter,
      llm: commonConfig.llm,
      operations: [{ graph: graphOperation }],
      on: TaskApplyTo.FULL_FIELD,
    };
    this.saveTask(this.type, parameters, commonConfig.applyTaskTo);
  }

  private initExampleGroup(entities: number, relations: number) {
    const example = new FormGroup({
      entities: new FormArray<FormGroup<{ name: FormControl<string>; label: FormControl<string> }>>([]),
      relations: new FormArray<
        FormGroup<{
          source: FormControl<string>;
          target: FormControl<string>;
          label: FormControl<string>;
        }>
      >([]),
      text: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    });
    for (let i = 0; i < entities; i++) {
      example.controls.entities.push(
        new FormGroup({
          name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
          label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        }),
      );
    }
    for (let i = 0; i < relations; i++) {
      example.controls.relations.push(
        new FormGroup({
          source: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
          target: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
          label: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        }),
      );
    }
    return example;
  }
}
