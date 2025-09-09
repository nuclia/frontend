
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  BraveConfig,
  BraveDriver,
  Driver,
  DriverCreation,
  GoogleConfig,
  GoogleDriver,
  InternetConfig,
  InternetProviderType,
  PerplexityDriver,
  TavilyDriver,
} from '@nuclia/core';

@Component({
  selector: 'app-internet-driver-modal',
  imports: [
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule
],
  templateUrl: './internet-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    provider: new FormControl<InternetProviderType | ''>('', { nonNullable: true }),
    key: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    endpoint: new FormControl<string>('web', { nonNullable: true }),
    vertexai: new FormControl<boolean>(false, { nonNullable: true, validators: [Validators.required] }),
    credentials: new FormControl<string | undefined>(undefined, { nonNullable: true }),
    project: new FormControl<string | undefined>(undefined, { nonNullable: true }),
    location: new FormControl<string | undefined>(undefined, { nonNullable: true }),
  });
  isEdit: boolean;
  driverList: Driver[] = [];

  get providerValue() {
    return this.form.controls.provider.getRawValue();
  }
  get keyControl() {
    return this.form.controls.key;
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
  get hasGoogle() {
    return this.driverList.some((driver) => driver.provider === 'google');
  }

  constructor(
    public modal: ModalRef<{
      driver: BraveDriver | PerplexityDriver | TavilyDriver | GoogleDriver;
      driverList: Driver[];
    }>,
  ) {
    const driver = this.modal.config.data?.driver;
    this.isEdit = !!driver;
    this.driverList = this.modal.config.data?.driverList || [];
    if (!!driver) {
      const config = driver.config;
      const baseConfig: { name: string; provider: InternetProviderType; key?: string } = {
        name: driver.name,
        provider: driver.provider,
      };
      if (driver.provider === 'google') {
        const { api_key, ...driverConfig } = config as GoogleConfig;
        baseConfig.key = api_key;
        this.form.patchValue({ ...baseConfig, ...driverConfig });
      } else {
        this.form.patchValue({ ...baseConfig, ...config });
      }
    }
  }

  onProviderChange() {
    if (this.providerValue === 'google') {
      this.keyControl.clearValidators();
    } else {
      this.keyControl.addValidators(Validators.required);
    }
    this.keyControl.updateValueAndValidity();
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { provider, name, key, ...rawConfig } = this.form.getRawValue();
      if (provider) {
        let config: InternetConfig | BraveConfig | GoogleConfig;
        switch (provider) {
          case 'brave':
            config = { key, endpoint: rawConfig.endpoint };
            break;
          case 'google':
            config = {
              api_key: key,
              vertexai: rawConfig.vertexai,
              credentials: rawConfig.credentials,
              project: rawConfig.project,
              location: rawConfig.location,
            };
            break;
          default:
            config = { key };
            break;
        }

        const driver: Omit<DriverCreation, 'identifier'> = {
          name,
          provider,
          config,
        };
        this.modal.close(driver);
      }
    }
  }
}
