import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { STFUtils } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IDriver } from '@nuclia/core';

@Component({
  selector: 'app-internet-driver-modal',
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './internet-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    provider: new FormControl<'brave' | 'perplexity' | 'tavily' | ''>('', { nonNullable: true }),
    key: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    endpoint: new FormControl<string | undefined>(undefined, { nonNullable: true }),
  });

  get providerValue() {
    return this.form.controls.provider.getRawValue();
  }

  constructor(public modal: ModalRef) {}

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { provider, name, ...rawConfig } = this.form.getRawValue();
      if (provider) {
        const config = provider === 'brave' ? rawConfig : { key: rawConfig.key };
        const driver: IDriver = {
          id: `${STFUtils.generateSlug(name)}_${STFUtils.generateRandomSlugSuffix()}`,
          name,
          provider,
          config,
        };
        this.modal.close(driver);
      }
    }
  }
}
