import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskRouteDirective } from '../task-route.directive';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaIconModule, PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import {
  LabelingConfiguration,
  LabelingConfigurationComponent,
} from '../labeling-configuration/labeling-configuration.component';
import { TasksAutomationService } from '../../tasks-automation.service';
import { LabelOperation, TaskApplyTo } from '@nuclia/core';
import { TaskSettingsComponent } from '../task-settings/task-settings.component';
import { map } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    TaskFormComponent,
    TaskSettingsComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaTextFieldModule,
    LabelingConfigurationComponent,
    PaIconModule,
    PaTableModule,
  ],
  templateUrl: './labeler.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelerComponent extends TaskRouteDirective {
  taskAutomation = inject(TasksAutomationService);
  TaskApplyTo = TaskApplyTo;

  labelingConfig?: LabelingConfiguration;
  labelOperation = this.task.pipe(
    map((task) => task?.parameters?.operations?.find((operation) => operation.label)?.label),
  );

  onConfigurationChange(configuration: LabelingConfiguration) {
    this.labelingConfig = configuration;
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    const labelOperation: LabelOperation = {
      ...this.labelingConfig?.label,
      triggers: commonConfig.webhook && [commonConfig.webhook],
    };
    this.taskAutomation
      .startTask(
        'labeler',
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: commonConfig.llm,
          operations: [{ label: labelOperation }],
          on: this.labelingConfig?.on !== undefined ? this.labelingConfig.on : TaskApplyTo.FULL_FIELD,
        },
        commonConfig.applyTaskTo,
      )
      .subscribe({
        complete: () => this.backToTaskList(),
        error: (error) => this.showError(error),
      });
  }
}
