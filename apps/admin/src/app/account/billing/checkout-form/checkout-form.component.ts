import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { CountrySelectComponent } from '@nuclia/sistema';
import { CheckoutService, CUSTOMER_FORM_ERRORS } from '../checkout/checkout.service';

@Component({
  selector: 'app-checkout-form',
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PaTextFieldModule, CountrySelectComponent, TranslatePipe],
})
export class CheckoutFormComponent {
  protected checkoutService = inject(CheckoutService);
  private cardContainer = viewChild<ElementRef<HTMLElement>>('card');
  errors = CUSTOMER_FORM_ERRORS;

  section = input.required<'billing' | 'card'>();

  constructor() {
    afterNextRender(() => {
      if (this.section() === 'card') {
        this.checkoutService.initStripe(() => this.cardContainer());
      }
    });
  }
}
