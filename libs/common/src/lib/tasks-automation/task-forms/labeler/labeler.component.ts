import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Operation, TaskApplyTo, TaskName } from '@nuclia/core';
import { InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import {
  LabelingConfiguration,
  LabelingConfigurationComponent,
} from '../labeling-configuration/labeling-configuration.component';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TaskRouteDirective } from '../task-route.directive';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    TaskFormComponent,
    TranslatePipe,
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
    const labelOperations: Operation[] = (this.labelingConfig?.operations || []).map((operation) => ({
      label: {
        ...operation,
        triggers: commonConfig.webhook && [commonConfig.webhook],
      },
    }));
    const parameters = {
      name: commonConfig.name,
      filter: commonConfig.filter,
      filter_expression_json: commonConfig.filter_expression_json,
      llm: commonConfig.llm,
      operations: labelOperations,
      on: this.labelingConfig?.on ?? TaskApplyTo.FULL_FIELD,
    };
    this.saveTask(this.type, parameters);
  }
}
