import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';

@Component({
  selector: 'app-summarize-form',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaTextFieldModule, ConfigurationFormComponent],
  templateUrl: './summarize-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarizeFormComponent extends FormDirective {
  override form = new FormGroup({
    summarize: new FormGroup({
      prompt: new FormControl('', { validators: Validators.required, nonNullable: true }),
    }),
  });
  override get configForm() {
    return this.form.controls.summarize;
  }
}
