import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OptionHeaderModel, OptionModel, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationFormComponent } from '../../basic-elements';

@Component({
  selector: 'app-rephrase-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
  ],
  templateUrl: './rephrase-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseFormComponent {
  form = new FormGroup({
    rephrase: new FormGroup({
      prompt: new FormControl('', { validators: [Validators.required], nonNullable: true }),
      extend: new FormControl(false),
      askTo: new FormControl(''),
      synonyms: new FormControl(false),
      history: new FormControl(false),
      userInfo: new FormControl(false),
    }),
  });

  // TODO: get sources depending on enabled KBs on drivers section
  sourceOptions: (OptionHeaderModel | OptionModel)[] = [
    new OptionHeaderModel({ id: 'sourceHeader', label: 'Nuclia KBs' }),
    new OptionModel({ id: '1', value: 'kbManuals', label: 'User manuals' }),
    new OptionModel({ id: '2', value: 'kbGuides', label: 'Maintenance guides' }),
    new OptionModel({ id: '3', value: 'kbForum', label: 'User forum' }),
  ];

  get isExtendEnabled() {
    return this.form.controls.rephrase.controls.extend.getRawValue();
  }

  submit() {
    // TODO
    console.log('submit rephrase form', this.form.getRawValue().rephrase);
  }
}
