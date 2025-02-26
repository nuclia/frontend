import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { ReactiveFormsModule } from '@angular/forms';
import { LabelModule, ParametersTableComponent, SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { TaskWithApplyOption } from '../task-route.directive';
import { map, switchMap, take } from 'rxjs';
import { FIELD_TYPE, SHORT_FIELD_TYPE, shortToLongFieldType, TaskTrigger } from '@nuclia/core';

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
  ],
  templateUrl: './task-settings.component.html',
  styleUrl: './task-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskSettingsComponent {
  private sdk = inject(SDKService);

  modelNames = this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) => kb.getLearningSchema()),
    map((schema) =>
      (schema?.['generative_model'].options || []).reduce(
        (acc, curr) => ({ ...acc, [curr.value]: curr.name }),
        {} as { [id: string]: string },
      ),
    ),
  );
  fieldTypes: FIELD_TYPE[] = [];
  notFieldTypes: FIELD_TYPE[] = [];
  labels: string[] = [];
  triggers: Trigger[] = [];

  @Input()
  set task(value: TaskWithApplyOption | undefined) {
    this._task = value;
    if (value?.parameters.filter.field_types?.length) {
      this.fieldTypes = this.mapFieldTypes(value.parameters.filter.field_types);
    }
    if (value?.parameters.filter.not_field_types?.length) {
      this.notFieldTypes = this.mapFieldTypes(value.parameters.filter.not_field_types);
    }
    if (value?.parameters.filter.labels?.length) {
      this.labels = value.parameters.filter.labels;
    }
    if (value) {
      this.triggers = this.mapTriggers(value);
    }
  }
  get task() {
    return this._task;
  }
  private _task: TaskWithApplyOption | undefined;

  private mapFieldTypes(fieldTypes: string[]) {
    return fieldTypes.map((type) => shortToLongFieldType(type as SHORT_FIELD_TYPE)).filter((type) => !!type);
  }

  private mapTriggers(task: TaskWithApplyOption) {
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
