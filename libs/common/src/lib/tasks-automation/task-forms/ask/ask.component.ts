import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TasksAutomationService } from '../../tasks-automation.service';
import { TaskApplyTo } from '@nuclia/core';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
  ],
  templateUrl: './ask.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskComponent extends TaskRouteDirective {
  taskAutomation = inject(TasksAutomationService);
  askForm = new FormGroup({
    question: new FormControl<string>('', [Validators.required]),
    fieldName: new FormControl<string>('', [Validators.required]),
  });

  activateTask(commonConfig: TaskFormCommonConfig) {
    this.taskAutomation
      .startTask(
        'ask',
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: commonConfig.llm,
          on: TaskApplyTo.FULL_FIELD,
          operations: [{ ask: { ...this.askForm.getRawValue() } }],
        },
        commonConfig.applyTaskTo,
      )
      .subscribe(() => {
        this.backToTaskList();
      });
  }
}
