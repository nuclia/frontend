import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonValidator } from '@flaps/common';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableTextareaComponent } from '../../../../../../../../../libs/sistema/src/lib/expandable-textarea/expandable-textarea.component';
import {
  ConfigurationFormComponent,
  FormDirective,
  HeadersFieldComponent,
  RulesFieldComponent,
} from '../../basic-elements';
import { ExternalAgentUI, formatHeaders } from '../../workflow.models';

@Component({
  selector: 'app-external-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
    HeadersFieldComponent,
    PaTextFieldModule,
    PaTogglesModule,
    ExpandableTextareaComponent,
  ],
  templateUrl: './external-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalFormComponent extends FormDirective {
  override form = new FormGroup({
    remi: new FormGroup({
      url: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      method: new FormControl<'POST' | 'GET' | 'PATCH'>('POST', { nonNullable: true }),
      description: new FormControl<string>('', { nonNullable: true }),
      prompt: new FormControl<string>('', { nonNullable: true }),
      payload: new FormControl<'none' | 'context' | 'call_schema' | 'call_obj'>('none', { nonNullable: true }),
      call_obj: new FormControl<string>('', { nonNullable: true, validators: [JsonValidator()] }),
      call_schema: new FormControl<string>('', { nonNullable: true, validators: [JsonValidator()] }),
      headers: new FormGroup({}),
      rules: new FormArray<FormControl<string>>([]),
    }),
  });
  override get configForm() {
    return this.form.controls.remi;
  }
  get payloadValue() {
    return this.configForm.controls.payload.value;
  }

  get headersGroup() {
    return this.configForm.controls.headers;
  }

  get externalConfig(): ExternalAgentUI {
    return this.config as ExternalAgentUI;
  }

  override submit() {
    if (this.form.valid) {
      const rawConfig = this.configForm.getRawValue();
      const config: ExternalAgentUI = {
        ...rawConfig,
        headers: rawConfig.headers ? formatHeaders(rawConfig.headers) : undefined,
      };
      this.submitForm.emit(config);
    }
  }
}
