import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TaskRouteDirective } from '../task-route.directive';
import { TaskApplyTo, TaskName } from '@nuclia/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { filter, take } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
  ],
  templateUrl: './llm-security.component.html',
  styleUrl: '../../_task.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LLMSecurityComponent extends TaskRouteDirective {
  TaskApplyTo = TaskApplyTo;
  type: TaskName = 'prompt-guard';

  form = new FormGroup({
    on: new FormControl<'resources' | 'text-blocks'>('resources', { nonNullable: true }),
  });

  constructor() {
    super();
    this.task
      .pipe(
        filter((task) => !!task),
        take(1),
      )
      .subscribe((task) => {
        this.form.patchValue({ on: task.parameters.on === TaskApplyTo.FULL_FIELD ? 'resources' : 'text-blocks' });
      });
  }

  onSave(commonConfig: TaskFormCommonConfig) {
    const parameters = {
      name: commonConfig.name,
      filter: commonConfig.filter,
      llm: {},
      on: this.form.value.on === 'resources' ? TaskApplyTo.FULL_FIELD : TaskApplyTo.TEXT_BLOCKS,
      operations: [{ prompt_guard: { enabled: true, triggers: commonConfig.webhook && [commonConfig.webhook] } }],
    };
    this.saveTask(this.type, parameters);
  }
}
