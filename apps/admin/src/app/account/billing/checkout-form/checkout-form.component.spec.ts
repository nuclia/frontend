import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { CountrySelectComponent } from '@nuclia/sistema';
import { MockComponent } from 'ng-mocks';
import { CheckoutService, createCustomerForm } from '../checkout/checkout.service';
import { CheckoutFormComponent } from './checkout-form.component';

@Component({
  selector: 'app-host',
  template: '<app-checkout-form [section]="section"></app-checkout-form>',
  imports: [CheckoutFormComponent],
  providers: [{ provide: CheckoutService, useFactory: () => checkoutService }],
})
class HostComponent {
  section: 'billing' | 'card' = 'billing';
}

let checkoutService: Partial<CheckoutService>;
const initStripe = jest.fn();
const cardError = signal('');

describe('CheckoutFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  function render(section: 'billing' | 'card', isCompany = false) {
    checkoutService = {
      customerForm: createCustomerForm(),
      isCompany,
      customer: (() => undefined) as unknown as CheckoutService['customer'],
      cardName: new FormControl('', { nonNullable: true }),
      cardError,
      initStripe,
    };
    fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.section = section;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    initStripe.mockReset();
    cardError.set('');
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideTranslateService({ fallbackLang: 'en' })],
    })
      .overrideComponent(CheckoutFormComponent, {
        remove: { imports: [CountrySelectComponent] },
        add: { imports: [MockComponent(CountrySelectComponent)] },
      })
      .compileComponents();
  });

  describe('billing section', () => {
    it('shows the company and VAT fields for companies', () => {
      render('billing', true);
      const element: HTMLElement = fixture.nativeElement;

      expect(element.querySelector('#company')).not.toBeNull();
      expect(element.querySelector('#vat')).not.toBeNull();
    });

    it('hides the company and VAT fields for individuals', () => {
      render('billing', false);
      const element: HTMLElement = fixture.nativeElement;

      expect(element.querySelector('#company')).toBeNull();
      expect(element.querySelector('#vat')).toBeNull();
      expect(element.querySelector('#name')).not.toBeNull();
    });

    it('does not render the card fields nor mount Stripe', () => {
      render('billing');

      expect(fixture.nativeElement.querySelector('.card-element')).toBeNull();
      expect(initStripe).not.toHaveBeenCalled();
    });
  });

  describe('card section', () => {
    it('mounts the Stripe card in its own container', () => {
      render('card');

      expect(initStripe).toHaveBeenCalledTimes(1);
      const container = initStripe.mock.calls[0][0]();
      expect(container.nativeElement).toBe(fixture.nativeElement.querySelector('.card-element > div'));
      expect(fixture.nativeElement.querySelector('#name')).toBeNull();
    });

    it('shows the card error', () => {
      render('card');
      cardError.set('Your card number is incomplete.');
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.card-error').textContent).toContain(
        'Your card number is incomplete.',
      );
    });
  });
});
