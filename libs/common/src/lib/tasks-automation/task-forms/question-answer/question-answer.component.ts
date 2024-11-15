import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TasksAutomationService } from '../../tasks-automation.service';
import { QAOperation, TaskApplyTo } from '@nuclia/core';
import { take } from 'rxjs';

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
    ReactiveFormsModule,
  ],
  templateUrl: './question-answer.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionAnswerComponent extends TaskRouteDirective {
  taskAutomation = inject(TasksAutomationService);

  questionAnswerForm = new FormGroup({
    generate_answers_prompt: new FormControl<string>('', { nonNullable: true }),
    question_generator_prompt: new FormControl<string>('', { nonNullable: true }),
  });

  constructor() {
    super();
    this.task?.pipe(take(1)).subscribe((task) => {
      const qaOperation = task?.parameters.operations?.find((operation) => !!operation.qa)?.qa;
      if (qaOperation) {
        this.questionAnswerForm.patchValue(qaOperation);
        this.questionAnswerForm.disable();
      }
    });
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    const operation: QAOperation =
      !!this.questionAnswerForm.value.generate_answers_prompt?.trim() ||
      !!this.questionAnswerForm.value.question_generator_prompt?.trim()
        ? this.questionAnswerForm.getRawValue()
        : {};
    this.taskAutomation
      .startTask(
        'synthetic-questions',
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: commonConfig.llm,
          on: TaskApplyTo.FULL_FIELD,
          operations: [{ qa: operation }],
        },
        commonConfig.applyTaskTo,
      )
      .subscribe(() => {
        this.backToTaskList();
      });
  }
}
