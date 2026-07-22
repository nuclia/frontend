import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonMiniComponent, ExpandableTextareaComponent, InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { ModalConfig, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FilterExpressionModalComponent } from 'libs/common/src/lib/search-widget/search-configuration/filter-expression-modal';
import { filter, map, take } from 'rxjs';
import { SourceFormDirective } from '../source-form.directive';
import { SDKService } from '@flaps/core';
import { FilterExpression } from '@nuclia/core';

@Component({
  selector: 'nsy-nucliadb-source',
  imports: [
    ButtonMiniComponent,
    CommonModule,
    ExpandableTextareaComponent,
    InfoCardComponent,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  styleUrl: './../_common-source.scss',
  templateUrl: './nucliadb-source.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: NucliadbSourceComponent, multi: true },
    { provide: NG_VALIDATORS, useExisting: NucliadbSourceComponent, multi: true },
  ],
})
export class NucliadbSourceComponent extends SourceFormDirective {
  private sdk = inject(SDKService);
  private modalService = inject(SisModalService);

  override form: FormGroup<{ filter_expression: FormControl<string> }> = new FormGroup({
    filter_expression: new FormControl('', { nonNullable: true }),
  });

  currentKb = this.sdk.currentKb.pipe(
    take(1),
    map((kb) => kb.title),
  );

  constructor() {
    super();
    this.initForm();
  }

  override mapValueToForm(value: { filter_expression?: FilterExpression }) {
    return { filter_expression: value.filter_expression ? JSON.stringify(value.filter_expression) : '' };
  }

  override mapFormToValue(formValue: { filter_expression: string }) {
    let json: FilterExpression | undefined = {};
    try {
      json = JSON.parse(formValue.filter_expression || '{}');
    } catch (e) {
      json = undefined;
    }
    return { filter_expression: json };
  }

  openAssistant() {
    this.modalService
      .openModal(
        FilterExpressionModalComponent,
        new ModalConfig({ data: { filterExpression: this.form.controls.filter_expression.value } }),
      )
      .onClose.pipe(filter((filters) => !!filters))
      .subscribe((filters: string) => this.form.controls.filter_expression.patchValue(filters));
  }
}
