import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TaskFormComponent } from '../task-form.component';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TaskRouteDirective } from '../task-route.directive';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    TranslateModule,
    TaskFormComponent,
    TwoColumnsConfigurationItemComponent,
    InfoCardComponent,
    PaTextFieldModule,
  ],
  templateUrl: './global-question.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalQuestionComponent extends TaskRouteDirective {
  generativeModels = ['nuclia-everest-v1', 'chatgpt-azure-3', 'chatgpt-azure', 'anthropic'];
}
