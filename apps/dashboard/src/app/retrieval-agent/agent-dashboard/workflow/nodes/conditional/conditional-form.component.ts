import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';

@Component({
  selector: 'app-conditional-form',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaTextFieldModule, ConfigurationFormComponent],
  templateUrl: './conditional-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalFormComponent extends FormDirective {
  override form = new FormGroup({
    conditional: new FormGroup({
      prompt: new FormControl<string>('', { validators: Validators.required, nonNullable: true }),
    }),
  });
  override get configForm() {
    return this.form.controls.conditional;
  }
}
