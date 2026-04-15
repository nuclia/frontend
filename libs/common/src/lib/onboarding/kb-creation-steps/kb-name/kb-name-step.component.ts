import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StickyFooterComponent } from '@nuclia/sistema';
import { FeaturesService, NavigationService } from '@flaps/core';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';
import { WorkflowType } from '@nuclia/core';

export interface KbNamePayload {
  kbName: string;
  workflow: WorkflowType;
}

@Component({
  selector: 'nus-kb-name-step',
  imports: [
    CommonModule,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTextFieldModule,
    StickyFooterComponent,
    PaButtonModule,
  ],
  templateUrl: './kb-name-step.component.html',
  styleUrls: ['../../_common-step.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbNameStepComponent {
  private navigation = inject(NavigationService);
  private features = inject(FeaturesService);
  private translateService = inject(TranslateService);

  inRaoApp = this.navigation.inRaoApp;
  coworkAccountEnabled = this.features.unstable.coworkAccount;

  // Radio buttons must be rendered once translations are ready
  translationsReady = this.translateService.get('test').pipe(map(() => true));

  @Input() set data(value: KbNamePayload) {
    this.form.patchValue(value);
  }

  @Output() next = new EventEmitter<KbNamePayload>();

  form = new FormGroup({
    kbName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    workflow: new FormControl<WorkflowType>('classic', { nonNullable: true }),
  });

  submitForm() {
    this.next.emit(this.form.getRawValue());
  }
}
