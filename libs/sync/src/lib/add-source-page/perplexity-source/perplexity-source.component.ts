import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { SourceFormDirective } from '../source-form.directive';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { PerplexitySource } from '@nuclia/core';

@Component({
  selector: 'nsy-perplexity-source',
  imports: [
    CommonModule,
    ExpandableTextareaComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
    ExpandableTextareaComponent,
  ],
  styleUrl: './../_common-source.scss',
  templateUrl: './perplexity-source.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: PerplexitySourceComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: PerplexitySourceComponent, multi: true },
  ],
})
export class PerplexitySourceComponent extends SourceFormDirective {
  override form = new FormGroup({
    enabled_domains: new FormControl<string>('', { nonNullable: true }),
  });

  constructor() {
    super();
    this.initForm();
  }

  override mapValueToForm(value: Partial<PerplexitySource>): { enabled_domains: string } {
    return { enabled_domains: (value.enabled_domains || []).join('\n') };
  }

  override mapFormToValue(formValue: { enabled_domains: string }): Partial<PerplexitySource> {
    return {
      enabled_domains: formValue.enabled_domains
        .split('\n')
        .map((domain) => domain.trim())
        .filter((domain) => !!domain),
    };
  }
}
