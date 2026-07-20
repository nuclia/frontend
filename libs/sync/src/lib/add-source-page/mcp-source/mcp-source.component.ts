import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import {
  FormArray,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SourceFormDirective } from '../source-form.directive';

@Component({
  selector: 'nsy-mcp-source',
  imports: [CommonModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  styleUrl: './../_common-source.scss',
  templateUrl: './mcp-source.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: McpSourceComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: McpSourceComponent, multi: true },
  ],
})
export class McpSourceComponent extends SourceFormDirective {
  override form: FormGroup<any> = new FormGroup({
    uri: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    timeout: new FormControl<number>(300, { nonNullable: true }),
    sse_read_timeout: new FormControl<number>(300, { nonNullable: true }),
    response_types: new FormArray<FormControl<string>>([new FormControl('code', { nonNullable: true })]),
    server_url: new FormControl<string>('', { nonNullable: true }),
    scope: new FormControl<string>('user', { nonNullable: true }),
  });

  constructor() {
    super();
    this.initForm();
  }
}
