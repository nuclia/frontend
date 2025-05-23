import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ModalRef,
  PaButtonModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DriverCreation, McpStdioConfig, McpStdioDriver } from '@nuclia/core';

let headerIndex = 0;

@Component({
  selector: 'app-mcpstdio-driver-modal',
  imports: [
    CommonModule,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './mcpstdio-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpStdioDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    command: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    args: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
    env: new FormGroup({}),
    cwd: new FormControl<string>('', { nonNullable: true }),
    encoding: new FormControl<string>('utf-8', { nonNullable: true }),
    encoding_error_handler: new FormControl<'strict' | 'ignore' | 'replace'>('strict', { nonNullable: true }),
  });
  isEdit: boolean;

  get envGroup() {
    return this.form.controls.env;
  }
  get args() {
    return this.form.controls.args;
  }
  get config() {
    return this.modal.config.data;
  }

  constructor(public modal: ModalRef<McpStdioDriver>) {
    const driver = this.modal.config.data;
    this.isEdit = !!driver;
    if (!!driver) {
      const config = driver.config;
      this.form.patchValue({ name: driver.name, ...config });
      const envs = Object.entries(config.env || {});
      if (envs.length > 0) {
        envs.forEach(([property, value]) => {
          this.addEnv(property, `${value}`);
        });
      }
    }
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { name, env, ...rawConfig } = this.form.getRawValue();
      const config: McpStdioConfig = { ...rawConfig, env: this.formatEnv(env) };
      const driver: DriverCreation = {
        name,
        provider: 'mcpstdio',
        config,
      };
      this.modal.close(driver);
    }
  }

  addEnv(property?: string, value?: string) {
    this.envGroup.addControl(
      `env${headerIndex++}`,
      new FormGroup({
        property: new FormControl<string>(property || '', { nonNullable: true, validators: [Validators.required] }),
        value: new FormControl(value || ''),
      }),
    );
  }

  removeEnv(key: string) {
    this.envGroup.removeControl(key);
  }

  private formatEnv(extra: { [property: string]: { property: string; value: string } }): {
    [property: string]: string;
  } {
    return Object.values(extra).reduce(
      (config, entry) => {
        config[entry.property] = entry.value;
        return config;
      },
      {} as { [property: string]: string },
    );
  }

  addArg() {
    this.args.push(new FormControl<string>('', { nonNullable: true }));
  }
  removeArg(index: number) {
    this.args.removeAt(index);
  }
}
