import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';

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
  ],
  templateUrl: './question-answer.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionAnswerComponent extends TaskRouteDirective {
  generativeModels = ['nuclia-everest-v1', 'chatgpt-azure-3', 'chatgpt-azure', 'anthropic'];
}
