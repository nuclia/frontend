import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DateAfter, DateBefore } from '@flaps/common';
import { ModalRef, PaButtonModule, PaDatePickerModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { addDays, addYears } from 'date-fns';
import { map } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    InfoCardComponent,
    PaDatePickerModule,
    PaModalModule,
    TranslateModule,
    PaButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './expiration-modal.component.html',
  styleUrl: './expiration-modal.component.scss',
})
export class ExpirationModalComponent {
  maxDate = addDays(new Date(), 1095);
  expiration = new FormControl<string>(addYears(new Date(), 1).toISOString(), {
    nonNullable: true,
    validators: [DateAfter(new Date().toISOString()), DateBefore(this.maxDate.toISOString()), Validators.required],
  });
  invalidDate = this.expiration.valueChanges.pipe(map(() => !!this.expiration.errors?.['dateAfter']));

  constructor(public modal: ModalRef<void, { expiration: string }>) {}

  add() {
    this.modal.close({ expiration: this.expiration.getRawValue() });
  }

  close() {
    this.modal.close();
  }
}
