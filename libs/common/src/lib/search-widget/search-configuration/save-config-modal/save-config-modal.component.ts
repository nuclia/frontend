import { AfterViewInit, ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

export type SaveConfigModalReason = 'default-readonly' | 'default-embed';

@Component({
  imports: [PaModalModule, TranslateModule, ReactiveFormsModule, PaTextFieldModule, PaButtonModule],
  templateUrl: './save-config-modal.component.html',
  styleUrl: './save-config-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveConfigModalComponent implements AfterViewInit {
  modal = inject(ModalRef<SaveConfigModalReason | undefined, string>);

  name = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });
  initialized = false;

  get reason(): SaveConfigModalReason | undefined {
    return this.modal.config.data;
  }

  ngAfterViewInit() {
    this.initialized = true;
  }

  submitName() {
    this.modal.close(this.name.getRawValue());
  }
}
