import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { isOriginalFieldId, SDKService } from '@flaps/core';
import {
  ModalRef,
  PaButtonModule,
  PaDatePickerModule,
  PaDropdownModule,
  PaModalModule,
  PaPopupModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ConversationField, IFieldData, Resource, ResourceField, ResourceProperties } from '@nuclia/core';
import { InfoCardComponent, SisToastService } from '@nuclia/sistema';
import { switchMap, take } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaDatePickerModule,
    PaDropdownModule,
    PaModalModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslatePipe,
    PaPopupModule,
  ],
  templateUrl: './reprocess-modal.component.html',
  styleUrl: './reprocess-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReprocessModalComponent {
  private sdk = inject(SDKService);
  private modal = inject(ModalRef<{ resourceId: string }>);
  private toaster = inject(SisToastService);

  form = new FormGroup({
    extractStrategy: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    field: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
  });

  extractStrategies = toSignal(
    this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.getExtractStrategies()),
    ),
  );
  resource = signal<Resource | null>(null);
  fields = computed<ResourceField[]>(() =>
    Object.entries(this.resource()?.data || {})
      .filter(([fieldType]) => ['files', 'links', 'texts', 'conversations'].includes(fieldType))
      .reduce((acc, [fieldType, fields]) => {
        acc.push(
          ...Object.entries(fields)
            .filter(([fieldId]) => isOriginalFieldId(fieldId))
            .map(([fieldId, field]) => ({
              ...field,
              field_id: fieldId,
              field_type: fieldType.slice(0, -1),
            })),
        );
        return acc;
      }, [] as ResourceField[]),
  );
  currentField = toSignal(this.form.controls.field.valueChanges);
  fieldStrategy = computed(() => {
    const fieldValue = this.fields().find((f) => f.field_id === this.currentField())?.value as Exclude<
      IFieldData['value'],
      ConversationField
    >;
    return fieldValue?.extract_strategy;
  });
  loading = signal(false);

  constructor() {
    effect(() => {
      if (this.fields().length > 0) {
        this.form.controls.field.setValue(this.fields()[0].field_id);
      }
    });

    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.getResource(this.modal.config.data?.['resourceId'], [ResourceProperties.BASIC, ResourceProperties.VALUES]),
        ),
      )
      .subscribe((resource) => this.resource.set(resource));
  }

  close() {
    this.modal.close();
  }

  submit() {
    const value = this.form.getRawValue();
    let field = this.fields().find((f) => f.field_id === value.field);
    if (field) {
      this.loading.set(true);
      this.resource()
        ?.patchField(field.field_type, field.field_id, {
          extract_strategy: value.extractStrategy,
        })
        .subscribe({
          next: () => {
            this.modal.close(true);
          },
          error: () => {
            this.toaster.error('resource.reprocess-modal.error');
            this.loading.set(false);
          },
        });
    }
  }
}
