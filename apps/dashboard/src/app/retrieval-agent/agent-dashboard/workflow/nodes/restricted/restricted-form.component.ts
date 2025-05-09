import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';

@Component({
  selector: 'app-restricted-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTextFieldModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
    ExpandableTextareaComponent,
  ],
  templateUrl: './restricted-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestrictedFormComponent extends FormDirective {
  override form = new FormGroup({
    restricted: new FormGroup({
      code: new FormControl('', { validators: Validators.required, nonNullable: true }),
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.restricted;
  }
}
