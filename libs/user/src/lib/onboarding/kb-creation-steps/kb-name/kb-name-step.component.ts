import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageFieldComponent } from '../../language-field/language-field.component';
import { StickyFooterComponent } from '@nuclia/sistema';

@Component({
  selector: 'nus-kb-name-step',
  standalone: true,
  imports: [
    CommonModule,
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    LanguageFieldComponent,
    PaTextFieldModule,
    StickyFooterComponent,
    PaButtonModule,
  ],
  templateUrl: './kb-name-step.component.html',
  styleUrls: ['../../_common-step.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbNameStepComponent {
  @Input() set data(value: string) {
    this.form.patchValue({ kbName: value });
  }

  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<string>();

  form = new FormGroup({
    kbName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  goBack() {
    this.back.emit();
  }

  submitForm() {
    this.next.emit(this.form.getRawValue().kbName);
  }
}
