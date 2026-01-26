import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { JSONSchema4 } from 'json-schema';
import { DriverFieldConfig } from '../driver-field-config.service';

import { ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ArrayStringFieldComponent } from '../../../agent-dashboard/workflow/basic-elements/node-form/subcomponents/array-string-field/array-string-field.component';
import { EnumSelectComponent } from '../../../agent-dashboard/workflow/basic-elements/node-form/subcomponents/enum-select/enum-select.component';
import { DriverSubformFieldComponent } from '../driver-subform-field/driver-subform-field.component';
import { ApiHeadersFieldComponent } from '../api-headers-field/api-headers-field.component';
import { DriverExpandableTextareaComponent } from '../driver-expandable-textarea/driver-expandable-textarea.component';

// Driver-specific field components
@Component({
  selector: 'kb-select',
  template: `
    <div [formGroup]="form">
      <pa-input
        [id]="controlName"
        [formControlName]="controlName"
        type="text"
        [placeholder]="'KB ID'"
        [required]="required">
        {{ label }}
        @if (required) {
          <span style="color: red">*</span>
        }
      </pa-input>
    </div>
  `,
  standalone: true,
  imports: [ReactiveFormsModule, PaTextFieldModule],
})
export class KbSelectComponent {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() required: boolean = false;
}

@Component({
  selector: 'key-value-field',
  template: `
    <div [formGroup]="form">
      <label>
        {{ label }}
        @if (required) {
          <span style="color: red">*</span>
        }
      </label>
      <div class="key-value-container">
        <pa-input
          [id]="controlName"
          [formControlName]="controlName"
          type="text"
          [placeholder]="'Enter JSON object or key=value pairs'"
          [required]="required"></pa-input>
        <small class="help-text">Enter as JSON object (e.g., {{ '{"key": "value"}' }}) or key=value pairs</small>
      </div>
    </div>
  `,
  styles: [
    `
      .key-value-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .help-text {
        color: var(--pa-color-neutral-600);
        font-size: 12px;
      }
    `,
  ],
  standalone: true,
  imports: [ReactiveFormsModule, PaTextFieldModule],
})
export class KeyValueFieldComponent {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() required: boolean = false;
}

@Component({
  selector: 'app-driver-field-renderer',
  templateUrl: './driver-field-renderer.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PaTextFieldModule,
    PaTogglesModule,
    ArrayStringFieldComponent,
    EnumSelectComponent,
    DriverSubformFieldComponent,
    ApiHeadersFieldComponent,
    KbSelectComponent,
    KeyValueFieldComponent,
    DriverExpandableTextareaComponent
],
})
export class DriverFieldRendererComponent implements OnInit {
  @Input() fieldConfig!: DriverFieldConfig;
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() property!: JSONSchema4;
  @Input() required: boolean = false;
  @Input() config?: any;

  ngOnInit() {
    // Component initialization
  }

  getInputType(): any {
    if (this.fieldConfig.type === 'password') return 'password';
    if (this.fieldConfig.type === 'number') return 'number';
    if (this.fieldConfig.type === 'url') return 'url';
    if (this.fieldConfig.type === 'email') return 'email';
    return 'text';
  }

  isReadonly(): boolean {
    return this.fieldConfig.additionalProps?.['readonly'] === true;
  }
}
