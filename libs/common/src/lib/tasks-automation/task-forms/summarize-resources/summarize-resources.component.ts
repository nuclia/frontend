import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButtonComponent, InfoCardComponent, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { TaskRouteDirective } from '../task-route.directive';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    PaTogglesModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
  ],
  templateUrl: './summarize-resources.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarizeResourcesComponent extends TaskRouteDirective {
  summaryForm = new FormGroup({
    summary: new FormControl<'simple' | 'extended'>('simple'),
    prompt: new FormControl<string>(''),
    fieldName: new FormControl<string>('', [Validators.required]),
  });

  activateTask(commonConfig: TaskFormCommonConfig) {
    // TODO
    console.log(`Activate summary task with`, commonConfig, this.summaryForm.getRawValue());
  }
}
