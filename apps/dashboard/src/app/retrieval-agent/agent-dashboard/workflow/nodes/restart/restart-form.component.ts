import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';

@Component({
  selector: 'app-restart-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
    ExpandableTextareaComponent,
  ],
  templateUrl: './restart-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestartFormComponent extends FormDirective {
  override form = new FormGroup({
    restart: new FormGroup({
      prompt: new FormControl('', { validators: Validators.required, nonNullable: true }),
      model: new FormControl('', { validators: Validators.required, nonNullable: true }),
      retries: new FormControl<number>(2, {
        validators: [Validators.required, Validators.pattern('^[0-9]*$')],
        nonNullable: true,
      }),
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.restart;
  }

  override submit() {
    if (this.form.valid) {
      const config = this.configForm.getRawValue();
      // Don't save empty rules
      config.rules = config.rules.filter((rule) => !!rule);
      this.submitForm.emit(config);
    }
  }
}
