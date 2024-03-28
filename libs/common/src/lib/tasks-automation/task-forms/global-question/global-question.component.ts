import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs';
import { TaskFormComponent } from '../task-form.component';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-global-question',
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
  styleUrl: './global-question.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalQuestionComponent {
  private activeRoute = inject(ActivatedRoute);

  taskId = this.activeRoute.params.pipe(
    filter((params) => !!params['taskId']),
    map((params) => params['taskId'] as string),
  );

  generativeModels = ['nuclia-everest-v1', 'chatgpt-azure-3', 'chatgpt-azure', 'anthropic'];
}
