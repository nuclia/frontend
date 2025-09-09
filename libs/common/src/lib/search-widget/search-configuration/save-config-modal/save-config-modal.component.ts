import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';

import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  imports: [PaModalModule, TranslateModule, ReactiveFormsModule, PaTextFieldModule, PaButtonModule],
  templateUrl: './save-config-modal.component.html',
  styleUrl: './save-config-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveConfigModalComponent implements AfterViewInit {
  name = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });
  initialized = false;

  constructor(public modal: ModalRef) {}

  ngAfterViewInit() {
    this.initialized = true;
  }

  submitName() {
    this.modal.close(this.name.getRawValue());
  }
}
