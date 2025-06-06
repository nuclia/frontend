import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AliniaDriver, DriverCreation } from '@nuclia/core';

@Component({
  selector: 'app-guardrails-driver-modal',
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './guardrails-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardrailsDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    key: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  isEdit: boolean;
  get config() {
    return this.modal.config.data;
  }

  constructor(public modal: ModalRef<AliniaDriver>) {
    const driver = this.modal.config.data;
    this.isEdit = !!driver;
    if (!!driver) {
      const config = driver.config;
      this.form.patchValue({ name: driver.name, ...config });
    }
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { name, ...config } = this.form.getRawValue();
      const driver: Omit<DriverCreation, 'identifier'> = {
        name,
        provider: 'alinia',
        config,
      };
      this.modal.close(driver);
    }
  }
}
