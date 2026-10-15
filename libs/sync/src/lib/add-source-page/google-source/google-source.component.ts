import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { GoogleSource, GoogleTimeRange } from '@nuclia/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { SourceFormDirective } from '../source-form.directive';

@Component({
  selector: 'nsy-google-source',
  imports: [
    CommonModule,
    ExpandableTextareaComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslatePipe,
    ExpandableTextareaComponent,
  ],
  styleUrl: './../_common-source.scss',
  templateUrl: './google-source.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: GoogleSourceComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: GoogleSourceComponent, multi: true },
  ],
})
export class GoogleSourceComponent extends SourceFormDirective {
  override form = new FormGroup({
    exclude_domains: new FormControl<string>('', { nonNullable: true }),
    time_range: new FormControl<GoogleTimeRange | 'none'>('none', { nonNullable: true }),
  });

  constructor() {
    super();
    this.initForm();
  }

  override mapValueToForm(value: Partial<GoogleSource>): {
    exclude_domains: string;
    time_range: GoogleTimeRange | 'none';
  } {
    return {
      exclude_domains: (value.exclude_domains || []).join('\n'),
      time_range: value.time_range || 'none',
    };
  }

  override mapFormToValue(formValue: {
    exclude_domains: string;
    time_range: GoogleTimeRange | 'none';
  }): Partial<GoogleSource> {
    return {
      time_range: formValue.time_range === 'none' ? undefined : formValue.time_range,
      exclude_domains: formValue.exclude_domains
        .split('\n')
        .map((domain) => domain.trim())
        .filter((domain) => !!domain),
    };
  }
}
