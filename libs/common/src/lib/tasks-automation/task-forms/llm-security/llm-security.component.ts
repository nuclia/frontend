import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TaskRouteDirective } from '../task-route.directive';
import { TasksAutomationService } from '../../tasks-automation.service';
import { TaskApplyTo } from '@nuclia/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
  ],
  templateUrl: './llm-security.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LLMSecurityComponent extends TaskRouteDirective {
  taskAutomation = inject(TasksAutomationService);

  form = new FormGroup({
    on: new FormControl<'resources' | 'text-blocks'>('resources', { nonNullable: true }),
  });

  constructor() {
    super();
    this.task?.pipe(take(1)).subscribe((task) => {
      this.form.patchValue({
        on: task?.parameters.on === TaskApplyTo.FULL_FIELD ? 'resources' : 'text-blocks',
      });
      this.form.disable();
    });
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    this.taskAutomation
      .startTask(
        'prompt-guard',
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: {},
          on: this.form.value.on === 'resources' ? TaskApplyTo.FULL_FIELD : TaskApplyTo.TEXT_BLOCKS,
          operations: [{ prompt_guard: { enabled: true } }],
        },
        commonConfig.applyTaskTo,
      )
      .subscribe(() => {
        this.backToTaskList();
      });
  }
}
