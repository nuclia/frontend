import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TaskSettingsComponent } from '../task-settings/task-settings.component';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TasksAutomationService } from '../../tasks-automation.service';
import { TaskApplyTo, TaskName } from '@nuclia/core';
import { map } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    TaskFormComponent,
    TaskSettingsComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaTogglesModule,
  ],
  templateUrl: './ask.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskComponent extends TaskRouteDirective {
  taskAutomation = inject(TasksAutomationService);
  askForm = new FormGroup({
    isJSON: new FormControl<boolean>(false, { nonNullable: true }),
    question: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    fieldName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern('[0-9a-zA-Z_]+')],
    }),
  });
  override errorMessages = {
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

  activateTask(commonConfig: TaskFormCommonConfig) {
    if (this.askForm.get('isJSON')?.value) {
      try {
        JSON.parse(this.askForm.get('question')?.value || '');
      } catch (e) {
        this.toaster.error('tasks-automation.generator.your-question.invalid-json');
        return;
      }
    }
    this.taskAutomation
      .startTask(
        this.type,
        {
          name: commonConfig.name,
          filter: commonConfig.filter,
          llm: commonConfig.llm,
          on: TaskApplyTo.FULL_FIELD,
          operations: [
            {
              ask: {
                json: this.askForm.get('isJSON')?.value,
                question: this.askForm.get('question')?.value,
                destination: this.askForm.get('fieldName')?.value,
                triggers: commonConfig.webhook && [commonConfig.webhook],
              },
            },
          ],
        },
        commonConfig.applyTaskTo,
      )
      .subscribe({
        complete: () => this.backToTaskList(),
        error: (error) => this.showError(error),
      });
  }
}
