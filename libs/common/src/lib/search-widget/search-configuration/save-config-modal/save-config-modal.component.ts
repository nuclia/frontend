import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NUCLIA_STANDARD_SEARCH_CONFIG } from '@nuclia/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

export type SaveConfigModalReason = 'default-readonly' | 'default-embed';
export interface SaveConfigModalData {
  reason?: SaveConfigModalReason;
  existingNames: string[];
}

@Component({
  imports: [PaModalModule, TranslatePipe, ReactiveFormsModule, PaTextFieldModule, PaButtonModule],
  templateUrl: './save-config-modal.component.html',
  styleUrl: './save-config-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveConfigModalComponent implements AfterViewInit {
  modal = inject(ModalRef<SaveConfigModalData, string>);

  private translate = inject(TranslateService);

  name = new FormControl<string>('', {
    validators: [Validators.required, (control) => this.nameValidator(control)],
    nonNullable: true,
  });
  validationMessages = {
    name: {
      required: 'validation.required',
      defaultName: 'search.configuration.save-config-modal.default-name-error',
      nameTaken: 'search.configuration.save-config-modal.name-taken-error',
    },
  };
  initialized = false;

  get reason(): SaveConfigModalReason | undefined {
    return this.modal.config.data?.reason;
  }

  ngAfterViewInit() {
    this.initialized = true;
  }

  submitName() {
    if (this.name.invalid) {
      this.name.markAsTouched();
      return;
    }
    this.modal.close(this.name.getRawValue());
  }

  /** A new configuration must not reuse the name of the built-in default or of an existing configuration. */
  private nameValidator(control: AbstractControl<string>): ValidationErrors | null {
    const value = control.value.trim().toLowerCase();
    const reservedNames = [
      NUCLIA_STANDARD_SEARCH_CONFIG.id,
      this.translate.instant('search.configuration.options.nuclia-standard'),
    ].map((name) => name.toLowerCase());
    if (reservedNames.includes(value)) {
      return { defaultName: true };
    }
    const existingNames = (this.modal.config.data?.existingNames ?? []).map((name) => name.toLowerCase());
    return existingNames.includes(value) ? { nameTaken: true } : null;
  }
}
