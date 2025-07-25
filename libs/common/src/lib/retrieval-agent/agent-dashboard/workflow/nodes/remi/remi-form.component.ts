
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';

@Component({
  selector: 'app-remi-form',
  imports: [ReactiveFormsModule, TranslateModule, ConfigurationFormComponent, RulesFieldComponent],
  templateUrl: './remi-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemiFormComponent extends FormDirective {
  override form = new FormGroup({
    remi: new FormGroup({
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.remi;
  }
}
