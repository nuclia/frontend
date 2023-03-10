import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  billing = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    vat: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    state: new FormControl<string>('', { nonNullable: true }),
    city: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    zip: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  budget = new FormGroup({
    budget: new FormControl<string>('0', { nonNullable: true, validators: [Validators.required] }),
  });

  errors: IErrorMessages = {
    required: 'validation.required',
  };

  constructor() {}
}
