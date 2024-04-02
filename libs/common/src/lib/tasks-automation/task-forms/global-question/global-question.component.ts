import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
  templateUrl: './global-question.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalQuestionComponent extends TaskRouteDirective {
  generativeModels = ['nuclia-everest-v1', 'chatgpt-azure-3', 'chatgpt-azure', 'anthropic'];

  globalQuestionForm = new FormGroup({
    question: new FormControl<string>('', [Validators.required]),
    fieldName: new FormControl<string>('', [Validators.required]),
  });

  activateTask(commonConfig: TaskFormCommonConfig) {
    // TODO
    console.log(`Activate global question with`, commonConfig, this.globalQuestionForm.getRawValue());
  }
}
