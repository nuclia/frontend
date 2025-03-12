import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TaskRouteDirective } from '../../task-route.directive';
import { TasksAutomationService } from '../../tasks-automation.service';
import { TaskApplyTo, TaskName } from '@nuclia/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [
    CommonModule,
    BackButtonComponent,
    PaTogglesModule,
    ReactiveFormsModule,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
  ],
  templateUrl: './content-safety.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentSafetyComponent extends TaskRouteDirective {
  taskAutomation = inject(TasksAutomationService);
  TaskApplyTo = TaskApplyTo;
  type: TaskName = 'llama-guard';

  form = new FormGroup({
    on: new FormControl<'resources' | 'text-blocks'>('resources', { nonNullable: true }),
  });

  activateTask(commonConfig: TaskFormCommonConfig) {
    this.taskAutomation
      .startTask(
        this.type,
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: {},
          on: this.form.value.on === 'resources' ? TaskApplyTo.FULL_FIELD : TaskApplyTo.TEXT_BLOCKS,
          operations: [{ llama_guard: { enabled: true, triggers: commonConfig.webhook && [commonConfig.webhook] } }],
        },
        commonConfig.applyTaskTo,
      )
      .subscribe({
        complete: () => this.backToTaskList(),
        error: (error) => this.showError(error),
      });
  }
}
