import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import {
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SourceFormDirective } from '../source-form.directive';
import { ParametersTableComponent } from '@flaps/core';

@Component({
  selector: 'nsy-mcp-source',
  imports: [CommonModule, ParametersTableComponent, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  styleUrl: './../_common-source.scss',
  templateUrl: './mcp-source.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: McpSourceComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: McpSourceComponent, multi: true },
  ],
})
export class McpSourceComponent extends SourceFormDirective {
  override form = new FormGroup({
    uri: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    headers: new FormControl<{ [key: string]: string }>({}),
  });

  headers: { key: string; value: string }[] = [];

  constructor() {
    super();
    this.initForm();
  }

  override mapValueToForm(value: { [key: string]: any; headers?: { [key: string]: string } }) {
    this.headers = value.headers ? Object.entries(value.headers).map(([key, value]) => ({ key, value })) : [];
    return value;
  }

  updateHeaders(value: { key: string; value: string }[]) {
    this.headers = value;
    this.form.controls['headers'].patchValue(value.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {}));
  }
}
