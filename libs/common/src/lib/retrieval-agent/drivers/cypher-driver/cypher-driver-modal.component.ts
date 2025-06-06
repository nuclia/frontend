import { CommonModule } from '@angular/common';
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
import { CypherConfig, CypherDriver, DriverCreation } from '@nuclia/core';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { formatExtraConfig } from '../../agent-dashboard/workflow';

let propertyIndex = 0;

@Component({
  selector: 'app-cypher-driver-modal',
  imports: [
    CommonModule,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    SisPasswordInputModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './cypher-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CypherDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    url: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    timeout: new FormControl<number>(0, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
    enhanced_schema: new FormControl<boolean>(true, { nonNullable: true }),
    database: new FormControl<string | null>(null),
    extra: new FormGroup({}),
  });
  isEdit: boolean;

  get extraGroup() {
    return this.form.controls.extra;
  }
  get config() {
    return this.modal.config.data;
  }

  constructor(public modal: ModalRef<CypherDriver>) {
    const driver = this.modal.config.data;
    this.isEdit = !!driver;
    if (!!driver) {
      const config = driver.config;
      this.form.patchValue({ name: driver.name, ...config, timeout: config.timeout || 0 });
      const extraConfig = Object.entries(config.config);
      if (extraConfig.length > 0) {
        extraConfig.forEach(([property, value]) => {
          this.addConfigProperty(property, `${value}`);
        });
      }
    }
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { name, extra, ...rawConfig } = this.form.getRawValue();
      const config: CypherConfig = { ...rawConfig, config: formatExtraConfig(extra) };
      const driver: Omit<DriverCreation, 'identifier'> = {
        name,
        provider: 'cypher',
        config,
      };
      this.modal.close(driver);
    }
  }

  addConfigProperty(property?: string, value?: string) {
    this.extraGroup.addControl(
      `property_${propertyIndex}`,
      new FormGroup({
        property: new FormControl<string>(property || '', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        value: new FormControl<string>(value || '', { nonNullable: true }),
      }),
    );
    propertyIndex++;
  }

  removeProperty(key: string) {
    this.extraGroup.removeControl(key);
  }
}
