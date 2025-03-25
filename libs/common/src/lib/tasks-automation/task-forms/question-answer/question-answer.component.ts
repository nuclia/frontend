import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { QAOperation, TaskApplyTo, TaskName } from '@nuclia/core';
import { filter, map, take } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    BackButtonComponent,
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
  type: TaskName = 'synthetic-questions';

  questionAnswerForm = new FormGroup({
    generate_answers_prompt: new FormControl<string>('', { nonNullable: true }),
    question_generator_prompt: new FormControl<string>('', { nonNullable: true }),
  });

  qaOperation = this.task.pipe(map((task) => task?.parameters?.operations?.find((operation) => operation.qa)?.qa));

  constructor() {
    super();
    this.qaOperation
      .pipe(
        filter((operation) => !!operation),
        take(1),
      )
      .subscribe((operation) => {
        this.questionAnswerForm.patchValue(operation);
      });
  }

  onSave(commonConfig: TaskFormCommonConfig) {
    const operation: QAOperation =
      !!this.questionAnswerForm.value.generate_answers_prompt?.trim() ||
      !!this.questionAnswerForm.value.question_generator_prompt?.trim()
        ? this.questionAnswerForm.getRawValue()
        : {};
    operation.triggers = commonConfig.webhook && [commonConfig.webhook];
    const parameters = {
      name: commonConfig.name,
      filter: commonConfig.filter,
      llm: commonConfig.llm,
      on: TaskApplyTo.FULL_FIELD,
      operations: [{ qa: operation }],
    };
    this.saveTask(this.type, parameters, commonConfig.applyTaskTo);
  }
}
