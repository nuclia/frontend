import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BackButtonComponent,
  DropdownButtonComponent,
  InfoCardComponent,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { LabelingConfigurationComponent } from '../labeling-configuration/labeling-configuration.component';
import { TaskFormCommonConfig, TaskFormComponent } from '../task-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { TaskRouteDirective } from '../task-route.directive';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { switchMap, take } from 'rxjs';
import { SDKService } from '@flaps/core';
import { Search } from '@nuclia/core';

@Component({
  selector: 'stf-label-ners',
  standalone: true,
  imports: [
    CommonModule,
    BackButtonComponent,
    InfoCardComponent,
    LabelingConfigurationComponent,
    TaskFormComponent,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    DropdownButtonComponent,
    PaDropdownModule,
    PaButtonModule,
    PaTextFieldModule,
  ],
  templateUrl: './label-ners.component.html',
  styleUrl: '../_task-form.common.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelNersComponent extends TaskRouteDirective implements OnInit {
  private sdk = inject(SDKService);
  private cdr = inject(ChangeDetectorRef);
  private toaster = inject(SisToastService);

  generativeModels = ['nuclia-everest-v1', 'chatgpt-azure-3', 'chatgpt-azure', 'anthropic'];

  detectionOptionsForm = new FormGroup({
    annotatedBy: new FormControl<'manually-added' | 'prompt'>('manually-added'),
    prompt: new FormControl<string>(''),
  });

  tokensCount?: number;

  get annotatedByValue() {
    return this.detectionOptionsForm.controls.annotatedBy.value;
  }

  get validForm() {
    const value = this.detectionOptionsForm.getRawValue();
    return (
      (value.annotatedBy === 'manually-added' && this.tokensCount && this.tokensCount > 0) ||
      (value.annotatedBy === 'prompt' && !!value.prompt)
    );
  }

  ngOnInit() {
    const facetId = `/entities`;
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.catalog('', { faceted: [facetId] })),
      )
      .subscribe({
        next: (results) => {
          if (results.type === 'error') {
            this.toaster.error('tasks-automation.errors.counting-labeled-resources');
          } else {
            const facets: Search.FacetsResult = results.fulltext?.facets || {};
            this.tokensCount = Object.values(facets[facetId] || {}).reduce((count, value) => {
              return count + value;
            }, 0);
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.toaster.error('tasks-automation.errors.counting-labeled-resources');
        },
      });
  }

  activateTask(commonConfig: TaskFormCommonConfig) {
    // TODO
    console.log(`Activate NER task with`, commonConfig, this.detectionOptionsForm.getRawValue());
  }
}
