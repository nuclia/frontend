import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { QAOperation, TaskApplyTo, TaskName } from '@nuclia/core';
import { filter, map, take } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
  ],
  templateUrl: './question-answer.component.html',
  styleUrl: '../../_task.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionAnswerComponent extends TaskRouteDirective {
  type: TaskName = 'synthetic-questions';

  readonly MAX_QUESTIONS = { min: 5, max: 200, default: 20 };

  questionAnswerForm = new FormGroup({
    generate_answers_prompt: new FormControl<string>('', { nonNullable: true }),
    question_generator_prompt: new FormControl<string>('', { nonNullable: true }),
    max_questions: new FormControl<number>(this.MAX_QUESTIONS.default, {
      nonNullable: true,
      validators: [Validators.min(this.MAX_QUESTIONS.min), Validators.max(this.MAX_QUESTIONS.max)],
    }),
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
    const { generate_answers_prompt, question_generator_prompt, max_questions } = this.questionAnswerForm.getRawValue();
    const operation: QAOperation = { max_questions };
    if (generate_answers_prompt?.trim()) {
      operation.generate_answers_prompt = generate_answers_prompt;
    }
    if (question_generator_prompt?.trim()) {
      operation.question_generator_prompt = question_generator_prompt;
    }
    operation.triggers = commonConfig.webhook && [commonConfig.webhook];
    const parameters = {
      name: commonConfig.name,
      filter: commonConfig.filter,
      filter_expression_json: commonConfig.filter_expression_json,
      llm: commonConfig.llm,
      on: TaskApplyTo.FULL_FIELD,
      operations: [{ qa: operation }],
    };
    this.saveTask(this.type, parameters);
  }
}
