import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { injectScript } from '@flaps/core';
import { take } from 'rxjs';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent implements AfterViewInit {
  STRIPE_PUBLIC_KEY = '';
  clientSecret = '';
  private _stripe: any;

  card: any;
  cardError: string = '';
  form = this.formBuilder.group({
    name: ['', [Validators.required]],
    company: [''],
    vat: [''],
  });

  @ViewChild('card') private stripeCardContainer?: ElementRef;

  constructor(private formBuilder: FormBuilder, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    this.injectStripe();
  }

  injectStripe() {
    injectScript('https://js.stripe.com/v3/')
      .pipe(take(1))
      .subscribe((result) => {
        this._stripe = result && (window as any)['Stripe'](this.STRIPE_PUBLIC_KEY);
        this.generateWidget();
      });
  }

  generateWidget() {
    const elements = this._stripe.elements();
    this.card = elements.create('card', {
      style: {
        base: {
          '::placeholder': {
            color: '#707070',
          },
        },
      },
    });
    this.card.mount(this.stripeCardContainer!.nativeElement);
    this.card.on('change', (event: any) => {
      this.cardError = event.error ? event.error.message : '';
      this.cdr.markForCheck();
    });
  }

  subscribe() {
    if (this.form.valid) {
      this._stripe
        .confirmCardPayment(this.clientSecret, {
          payment_method: {
            card: this.card,
            billing_details: {
              name: this.form.value.name,
            },
          },
        })
        .then((result: any) => {
          // TODO: handle result.error or result.paymentIntent
        });
    }
  }
}
