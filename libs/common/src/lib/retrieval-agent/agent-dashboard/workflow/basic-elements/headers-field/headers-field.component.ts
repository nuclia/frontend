import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { McpSseConfig } from '@nuclia/core';
import { ExternalAgentUI } from '../../workflow.models';

let headerIndex = 0;

@Component({
  selector: 'app-headers-field',
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './headers-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class HeadersFieldComponent implements OnInit {
  /**
   * Required form group containing a FormGroup control named "headers"
   */
  form = input.required<FormGroup>();
  /**
   * Saved config to properly initialise headers
   */
  config = input<ExternalAgentUI | McpSseConfig>();

  get headersGroup(): FormGroup<{}> {
    return this.form().controls['headers'] as FormGroup;
  }

  ngOnInit(): void {
    const config = this.config();
    if (config?.headers) {
      const headers = Object.entries(config.headers);
      if (headers.length > 0) {
        headers.forEach(([property, value]) => {
          this.addHeader(property, `${value}`);
        });
      }
    }
  }

  addHeader(property?: string, value?: string) {
    this.headersGroup.addControl(
      `header${headerIndex++}`,
      new FormGroup({
        property: new FormControl<string>(property || '', { nonNullable: true, validators: [Validators.required] }),
        value: new FormControl(value || ''),
      }),
    );
  }

  removeHeader(key: string) {
    this.headersGroup.removeControl(key);
  }
}
