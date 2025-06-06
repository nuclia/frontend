import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskApplyTo, TaskName } from '@nuclia/core';
import { filter, map, take } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaTogglesModule,
  ],
  templateUrl: './ask.component.html',
  styleUrl: '../../_task.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskComponent extends TaskRouteDirective {
  askForm = new FormGroup({
    json: new FormControl<boolean>(false, { nonNullable: true }),
    question: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    destination: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('[0-9a-zA-Z_]+')],
    }),
    customPrompt: new FormControl<boolean>(false, { nonNullable: true }),
  });
  errorMessages = {
    required: 'validation.required',
    pattern: 'tasks-automation.generator.field-name.invalid',
  };

  askOperation = this.task.pipe(map((task) => task?.parameters?.operations?.find((operation) => operation.ask)?.ask));
  type: TaskName = 'ask';

  jsonExample = {
    name: 'book',
    description: 'Information about the book',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'The title of the book',
        },
        author: {
          type: 'string',
          description: 'The author of the book',
        },
        ref_num: {
          type: 'string',
          description: 'The ISBN of the book',
        },
      },
      required: ['title', 'author', 'ref_num'],
    },
  };

  get isJSON() {
    return this.askForm.controls.json.value;
  }
  get customPrompt() {
    return this.askForm.controls.customPrompt.value;
  }

  constructor() {
    super();
    this.askOperation
      .pipe(
        filter((operation) => !!operation),
        take(1),
      )
      .subscribe((operation) => {
        const customPrompt = !!operation.user_prompt && !operation.json;
        this.askForm.patchValue({
          ...operation,
          question: customPrompt ? operation.user_prompt : operation.question,
          customPrompt,
        });
        this.updateForm();
      });
  }

  onSave(commonConfig: TaskFormCommonConfig) {
    if (this.askForm.get('json')?.value) {
      try {
        JSON.parse(this.askForm.get('question')?.value || '');
      } catch (e) {
        this.toaster.error('tasks-automation.generator.your-question.invalid-json');
        return;
      }
    }
    const parameters = {
      name: commonConfig.name,
      filter: commonConfig.filter,
      llm: commonConfig.llm,
      on: TaskApplyTo.FULL_FIELD,
      operations: [
        {
          ask: {
            json: this.isJSON,
            question: this.customPrompt && !this.isJSON ? '' : this.askForm.get('question')?.value,
            user_prompt: this.customPrompt && !this.isJSON ? this.askForm.get('question')?.value : undefined,
            destination: this.askForm.get('destination')?.value,
            triggers: commonConfig.webhook && [commonConfig.webhook],
          },
        },
      ],
    };
    this.saveTask(this.type, parameters);
  }

  updateForm() {
    const customPrompt = this.askForm.controls.customPrompt;
    if (this.isJSON) {
      customPrompt.reset();
      customPrompt.disable();
    } else {
      customPrompt.enable();
    }
  }
}
