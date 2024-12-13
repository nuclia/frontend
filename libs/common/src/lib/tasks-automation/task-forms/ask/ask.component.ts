import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BackButtonComponent,
  InfoCardComponent,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TaskSettingsComponent } from '../task-settings/task-settings.component';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TasksAutomationService } from '../../tasks-automation.service';
import { TaskApplyTo } from '@nuclia/core';
import { map } from 'rxjs';

@Component({
  standalone: true,
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
  toaster = inject(SisToastService);
  askForm = new FormGroup({
    isJSON: new FormControl<boolean>(false, { nonNullable: true }),
    question: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    fieldName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  askOperation = this.task.pipe(map((task) => task?.parameters?.operations?.find((operation) => operation.ask)?.ask));

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
        'ask',
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
              },
            },
          ],
        },
        commonConfig.applyTaskTo,
      )
      .subscribe(() => {
        this.backToTaskList();
      });
  }
}
