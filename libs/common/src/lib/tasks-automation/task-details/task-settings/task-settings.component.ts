import { ChangeDetectionStrategy, Component, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { ReactiveFormsModule } from '@angular/forms';
import { LabelModule, ParametersTableComponent, SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { map, switchMap, take } from 'rxjs';
import {
  AskOperation,
  FIELD_TYPE,
  GraphOperation,
  LabelOperation,
  QAOperation,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
  TaskApplyTo,
  TaskTrigger,
} from '@nuclia/core';
import { PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { DataAugmentationTaskOnGoing, hasFilters } from '../../tasks-automation.models';

interface Trigger {
  url: string;
  headers: { key: string; value: string }[];
  params: { key: string; value: string }[];
}

@Component({
  selector: 'app-task-settings',
  imports: [
    CommonModule,
    LabelModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
    BadgeComponent,
    ParametersTableComponent,
    InfoCardComponent,
    PaTableModule,
    PaTextFieldModule,
  ],
  templateUrl: './task-settings.component.html',
  styleUrl: './task-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskSettingsComponent {
  private sdk = inject(SDKService);

  modelsInfo = this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) => kb.getLearningSchema()),
    map((schema) =>
      (schema?.['generative_model'].options || []).reduce(
        (acc, curr) => ({ ...acc, [curr.value]: { name: curr.name, userKey: curr.user_key || '' } }),
        {} as { [id: string]: { name: string; userKey: string } },
      ),
    ),
  );
  fieldTypes: FIELD_TYPE[] = [];
  notFieldTypes: FIELD_TYPE[] = [];
  labels: string[] = [];
  triggers: Trigger[] = [];
  apply_to_agent_generated_fields = false;
  hasFilters = false;
  TaskApplyTo = TaskApplyTo;

  askOperation?: AskOperation;
  labelOperations?: LabelOperation[];
  graphOperation?: GraphOperation;
  qaOperation?: QAOperation;

  @Input()
  set task(value: DataAugmentationTaskOnGoing | undefined) {
    this._task = value;
    if (value) {
      if (value.parameters.filter.field_types?.length) {
        this.fieldTypes = this.mapFieldTypes(value.parameters.filter.field_types);
      }
      if (value.parameters.filter.not_field_types?.length) {
        this.notFieldTypes = this.mapFieldTypes(value.parameters.filter.not_field_types);
      }
      this.labels = value.parameters?.filter?.labels || [];
      this.apply_to_agent_generated_fields = value.parameters.filter.apply_to_agent_generated_fields || false;
      this.triggers = this.mapTriggers(value);
      this.hasFilters = hasFilters(value.parameters);
    }
    this.askOperation = this.task?.parameters?.operations?.find((operation) => operation.ask)?.ask;
    this.labelOperations = this.task?.parameters?.operations
      ?.filter((operation) => operation.label)
      .map((operation) => operation.label as LabelOperation);
    this.graphOperation = this.task?.parameters?.operations?.find((operation) => operation.graph)?.graph;
    this.qaOperation = this.task?.parameters?.operations?.find((operation) => operation.qa)?.qa;
  }
  get task() {
    return this._task;
  }
  private _task: DataAugmentationTaskOnGoing | undefined;

  private mapFieldTypes(fieldTypes: string[]) {
    return fieldTypes.map((type) => shortToLongFieldType(type as SHORT_FIELD_TYPE)).filter((type) => !!type);
  }

  private mapTriggers(task: DataAugmentationTaskOnGoing) {
    return (task.parameters.operations || []).reduce((acc, curr) => {
      Object.entries(curr).forEach(([, operation]) => {
        const triggers = (operation?.triggers || []).map((trigger: TaskTrigger) => ({
          ...trigger,
          headers: Object.entries(trigger.headers || {}).map(([key, value]) => ({ key, value })),
          params: Object.entries(trigger.params || {}).map(([key, value]) => ({ key, value })),
        }));
        acc = acc.concat(triggers);
      });
      return acc;
    }, [] as Trigger[]);
  }
}
