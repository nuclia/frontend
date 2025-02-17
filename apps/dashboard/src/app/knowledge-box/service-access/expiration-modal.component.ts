import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateAfter } from '@flaps/common';
import { ModalRef, PaButtonModule, PaDatePickerModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, PaDatePickerModule, PaModalModule, TranslateModule, PaButtonModule, ReactiveFormsModule],
  templateUrl: './expiration-modal.component.html',
  styleUrl: './expiration-modal.component.scss',
})
export class ExpirationModalComponent {
  expiration = new FormControl<Date>(new Date(), {
    nonNullable: true,
    validators: [DateAfter(new Date().toISOString()), Validators.required],
  });

  constructor(public modal: ModalRef<void, { expiration: Date }>) {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    this.expiration.setValue(date);
  }

  add() {
    this.modal.close({ expiration: this.expiration.getRawValue() });
  }

  close() {
    this.modal.close();
  }
}
