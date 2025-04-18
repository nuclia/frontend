import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { STFUtils } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { McpDriver } from '@nuclia/core';

let headerIndex = 0;

@Component({
  selector: 'app-mcp-driver-modal',
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './mcp-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    uri: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    key: new FormControl<string | null>(null),
    timeout: new FormControl<number>(5, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
    sse_read_timeout: new FormControl<number>(300, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
    headers: new FormGroup({}),
  });

  get headersGroup() {
    return this.form.controls.headers;
  }

  constructor(public modal: ModalRef) {}

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const { name, headers, ...rawConfig } = this.form.getRawValue();
      const config = { ...rawConfig, headers: this.formatHeaders(headers) };
      const driver: McpDriver = {
        id: `${STFUtils.generateSlug(name)}_${STFUtils.generateRandomSlugSuffix()}`,
        name,
        provider: 'mcp',
        config,
      };
      this.modal.close(driver);
    }
  }

  addHeader() {
    this.headersGroup.addControl(
      `header${headerIndex++}`,
      new FormGroup({
        property: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        value: new FormControl(''),
      }),
    );
  }

  removeHeader(key: string) {
    this.headersGroup.removeControl(key);
  }

  private formatHeaders(extra: { [property: string]: { property: string; value: string } }): {
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
}
