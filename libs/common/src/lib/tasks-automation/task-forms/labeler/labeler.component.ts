import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskRouteDirective } from '../task-route.directive';
import { InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import {
  LabelingConfiguration,
  LabelingConfigurationComponent,
} from '../labeling-configuration/labeling-configuration.component';
import { LabelOperation, TaskApplyTo, TaskName } from '@nuclia/core';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaTextFieldModule,
    LabelingConfigurationComponent,
    PaIconModule,
  ],
  templateUrl: './labeler.component.html',
  styleUrl: '../../_task.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelerComponent extends TaskRouteDirective {
  type: TaskName = 'labeler';

  labelingConfig?: LabelingConfiguration;

  onConfigurationChange(configuration: LabelingConfiguration) {
    this.labelingConfig = configuration;
  }

  onSave(commonConfig: TaskFormCommonConfig) {
    const labelOperation: LabelOperation = {
      ...this.labelingConfig?.label,
      triggers: commonConfig.webhook && [commonConfig.webhook],
    };
    const parameters = {
      name: commonConfig.name,
      filter: commonConfig.filter,
      llm: commonConfig.llm,
      operations: [{ label: labelOperation }],
      on: this.labelingConfig?.on !== undefined ? this.labelingConfig.on : TaskApplyTo.FULL_FIELD,
    };
    this.saveTask(this.type, parameters);
  }
}
