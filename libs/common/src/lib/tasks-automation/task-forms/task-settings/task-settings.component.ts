import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { ReactiveFormsModule } from '@angular/forms';
import { LabelModule, SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { TaskWithApplyOption } from '../task-route.directive';
import { map, switchMap, take } from 'rxjs';
import { FIELD_TYPE, SHORT_FIELD_TYPE, shortToLongFieldType } from '@nuclia/core';

@Component({
  selector: 'app-task-settings',
  standalone: true,
  imports: [
    CommonModule,
    LabelModule,
    ReactiveFormsModule,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
    BadgeComponent,
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

  @Input()
  set task(value: TaskWithApplyOption | undefined) {
    this._task = value;
    if (value?.parameters.filter.field_types?.length) {
      this.fieldTypes = value.parameters.filter.field_types
        .map((type) => shortToLongFieldType(type as SHORT_FIELD_TYPE))
        .filter((type) => !!type);
    }
  }
  get task() {
    return this._task;
  }
  private _task: TaskWithApplyOption | undefined;
}
