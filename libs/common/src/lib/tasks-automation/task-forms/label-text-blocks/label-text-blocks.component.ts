import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskRouteDirective } from '../task-route.directive';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
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
    PaIconModule,
  ],
  templateUrl: './label-text-blocks.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelTextBlocksComponent extends TaskRouteDirective {
  generativeModels = ['nuclia-everest-v1', 'chatgpt-azure-3'];
  labelingConfig?: LabelingConfiguration;

  onConfigurationChange(configuration: LabelingConfiguration) {
    this.labelingConfig = configuration;
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    // TODO
    console.log(`Activate label text blocks task with`, commonConfig, this.labelingConfig);
  }
}
