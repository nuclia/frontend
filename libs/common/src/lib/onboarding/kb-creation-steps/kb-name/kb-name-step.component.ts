import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';

import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StickyFooterComponent } from '@nuclia/sistema';
import { NavigationService } from '@flaps/core';

@Component({
  selector: 'nus-kb-name-step',
  imports: [
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
  inRaoApp = this.navigation.inRaoApp;

  @Input() set data(value: string) {
    this.form.patchValue({ kbName: value });
  }

  @Output() next = new EventEmitter<string>();

  form = new FormGroup({
    kbName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  submitForm() {
    this.next.emit(this.form.getRawValue().kbName);
  }
}
