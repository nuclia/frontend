import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';

@Component({
  selector: 'app-validation-form',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, ConfigurationFormComponent, RulesFieldComponent],
  templateUrl: './validation-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationFormComponent extends FormDirective {
  override form = new FormGroup({
    validation: new FormGroup({
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.validation;
  }
}
