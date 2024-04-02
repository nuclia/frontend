import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskRouteDirective } from '../task-route.directive';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import {
  LabelingConfiguration,
  LabelingConfigurationComponent,
} from '../labeling-configuration/labeling-configuration.component';

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
    LabelingConfigurationComponent,
  ],
  templateUrl: './label-resources.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelResourcesComponent extends TaskRouteDirective {
  generativeModels = ['nuclia-everest-v1', 'chatgpt-azure-3'];
  labelingConfig?: LabelingConfiguration;

  onConfigurationChange(configuration: LabelingConfiguration) {
    this.labelingConfig = configuration;
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    // TODO
    console.log(`Activate label resources task with`, commonConfig, this.labelingConfig);
  }
}
