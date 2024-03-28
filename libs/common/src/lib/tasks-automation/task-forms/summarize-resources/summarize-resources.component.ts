import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { TaskRouteDirective } from '../task-route.directive';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-summarize-resources',
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaTogglesModule,
    PaTextFieldModule,
  ],
  templateUrl: './summarize-resources.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarizeResourcesComponent extends TaskRouteDirective {
  generativeModels = ['nuclia-everest-v1', 'chatgpt-azure-3', 'chatgpt-azure', 'anthropic'];
}
