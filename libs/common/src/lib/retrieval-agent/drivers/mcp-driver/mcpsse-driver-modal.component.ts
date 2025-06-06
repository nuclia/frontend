import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DriverCreation, McpSseConfig, McpSseDriver } from '@nuclia/core';
import { formatHeaders, HeadersFieldComponent } from '../../agent-dashboard/workflow';

let headerIndex = 0;

@Component({
  selector: 'app-mcpsse-driver-modal',
  imports: [
    CommonModule,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
    HeadersFieldComponent,
  ],
  templateUrl: './mcpsse-driver-modal.component.html',
  styleUrl: '../driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpSseDriverModalComponent {
  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    uri: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    key: new FormControl<string | null>(null),
    timeout: new FormControl<number>(5, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
    sse_read_timeout: new FormControl<number>(300, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
    headers: new FormGroup({}),
  });
  isEdit: boolean;

  get headersGroup() {
    return this.form.controls.headers;
  }
  get config() {
    return this.modal.config.data;
  }

  constructor(public modal: ModalRef<McpSseDriver>) {
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
      const { name, headers, ...rawConfig } = this.form.getRawValue();
      const config: McpSseConfig = { ...rawConfig, headers: formatHeaders(headers) };
      const driver: Omit<DriverCreation, 'identifier'> = {
        name,
        provider: 'mcpsse',
        config,
      };
      this.modal.close(driver);
    }
  }
}
