import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskRouteDirective } from '../task-route.directive';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import {
  LabelingConfiguration,
  LabelingConfigurationComponent,
} from '../labeling-configuration/labeling-configuration.component';
import { TasksAutomationService } from '../../tasks-automation.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaTextFieldModule,
    LabelingConfigurationComponent,
    PaIconModule,
  ],
  templateUrl: './label-text-blocks.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelTextBlocksComponent extends TaskRouteDirective {
  taskAutomation = inject(TasksAutomationService);

  labelingConfig?: LabelingConfiguration;

  onConfigurationChange(configuration: LabelingConfiguration) {
    this.labelingConfig = configuration;
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    this.taskAutomation.startTask(
      'text-blocs-labeler',
      {
        name: commonConfig.name,
        filter: commonConfig.filter,
        llm: commonConfig.llm,
        operations: {
          label: this.labelingConfig?.label,
        },
      },
      commonConfig.applyTaskTo,
    );
  }
}
