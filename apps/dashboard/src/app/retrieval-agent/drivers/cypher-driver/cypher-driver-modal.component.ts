import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { STFUtils } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CypherDriver } from '@nuclia/core';
import { SisPasswordInputModule } from '@nuclia/sistema';

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

  get extraGroup() {
    return this.form.controls.extra;
  }

  constructor(public modal: ModalRef) {}

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { name, extra, ...rawConfig } = this.form.getRawValue();
      const config = { ...rawConfig, config: this.formatExtraConfig(extra) };
      const driver: CypherDriver = {
        id: `${STFUtils.generateSlug(name)}_${STFUtils.generateRandomSlugSuffix()}`,
        name,
        provider: 'cypher',
        config,
      };
      this.modal.close(driver);
    }
  }

  addConfigProperty() {
    this.extraGroup.addControl(
      `property_${propertyIndex}`,
      new FormGroup({
        property: new FormControl<string>('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        value: new FormControl<string>('', { nonNullable: true }),
      }),
    );
    propertyIndex++;
  }

  removeProperty(key: string) {
    this.extraGroup.removeControl(key);
  }

  private formatExtraConfig(extra: { [property: string]: { property: string; value: string } }): {
    [property: string]: string | number | null;
  } {
    return Object.values(extra).reduce(
      (config, entry) => {
        const intValue = parseInt(entry.value, 10);
        config[entry.property] = isNaN(intValue) ? entry.value : intValue;
        return config;
      },
      {} as { [property: string]: string | number | null },
    );
  }
}
