import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BraveDriver, Driver, DriverCreation, InternetConfig, PerplexityDriver, TavilyDriver } from '@nuclia/core';

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
  isEdit: boolean;
  driverList: Driver[] = [];

  get providerValue() {
    return this.form.controls.provider.getRawValue();
  }
  get config() {
    return this.modal.config.data?.driver;
  }
  get hasBrave() {
    return this.driverList.some((driver) => driver.provider === 'brave');
  }
  get hasPerplexity() {
    return this.driverList.some((driver) => driver.provider === 'perplexity');
  }
  get hasTavily() {
    return this.driverList.some((driver) => driver.provider === 'tavily');
  }

  constructor(public modal: ModalRef<{ driver: BraveDriver | PerplexityDriver | TavilyDriver; driverList: Driver[] }>) {
    const driver = this.modal.config.data?.driver;
    this.isEdit = !!driver;
    this.driverList = this.modal.config.data?.driverList || [];
    if (!!driver) {
      const config = driver.config;
      this.form.patchValue({ name: driver.name, provider: driver.provider, ...config });
    }
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { provider, name, ...rawConfig } = this.form.getRawValue();
      if (provider) {
        const config: InternetConfig = provider === 'brave' ? rawConfig : { key: rawConfig.key };
        const driver: DriverCreation = {
          name,
          provider,
          config,
        };
        this.modal.close(driver);
      }
    }
  }
}
