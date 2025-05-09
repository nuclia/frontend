import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';

@Component({
  selector: 'app-historical-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
  ],
  templateUrl: './historical-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalFormComponent extends FormDirective {
  override form = new FormGroup({
    historical: new FormGroup({
      all: new FormControl(true, { nonNullable: true }),
      rules: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
    }),
  });
  override get configForm() {
    return this.form.controls.historical;
  }
}
