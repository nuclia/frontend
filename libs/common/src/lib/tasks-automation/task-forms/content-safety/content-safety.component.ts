import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TaskRouteDirective } from '../task-route.directive';
import { TasksAutomationService } from '../../tasks-automation.service';
import { TaskApplyTo } from '@nuclia/core';
import { take } from 'rxjs';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
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
        'llama-guard',
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: commonConfig.llm,
          on: this.form.value.on === 'resources' ? TaskApplyTo.FULL_FIELD : TaskApplyTo.TEXT_BLOCKS,
          operations: [{ llama_guard: { enabled: true } }],
        },
        commonConfig.applyTaskTo,
      )
      .subscribe(() => {
        this.backToTaskList();
      });
  }
}
