import { TestBed } from '@angular/core/testing';
import { BillingService, NavigationService, SDKService, StripeCustomer, UserService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { of } from 'rxjs';
import { SubscriptionService } from '../subscription.service';
import { CheckoutError, CheckoutService } from './checkout.service';

describe('CheckoutService', () => {
  const company: StripeCustomer = {
    customer_id: 'customer',
    billing_details: {
      name: 'Jane',
      email: 'jane@example.test',
      phone: '1',
      is_company: true,
      company: 'ACME',
      vat: 'GB123',
      address: '1 Street',
      city: 'London',
      postal_code: 'SW1',
      country: 'GB',
    },
  };
  let service: CheckoutService;
  let billing: { getCustomer: jest.Mock; getCurrency: jest.Mock; getPrices: jest.Mock };
  let showError: jest.Mock;

  beforeEach(() => {
    showError = jest.fn();
    billing = {
      getCustomer: jest.fn().mockReturnValue(of(company)),
      getCurrency: jest.fn().mockReturnValue(of('EUR')),
      getPrices: jest.fn().mockReturnValue(of({ cowork: {} })),
    };
    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: BillingService, useValue: billing },
        { provide: SDKService, useValue: {} },
        { provide: UserService, useValue: { userPrefs: of({ email: 'user@example.test' }) } },
        { provide: NavigationService, useValue: {} },
        { provide: SisModalService, useValue: {} },
        { provide: SisToastService, useValue: { error: showError } },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: SubscriptionService, useValue: { initialCurrency: of('USD') } },
      ],
    });
    service = TestBed.inject(CheckoutService);
  });

  it('fills the form from the saved customer and maps is_company to not_company', () => {
    service.loadCustomer().subscribe();

    expect(service.customer()).toEqual(company);
    expect(service.customerForm.value).toEqual(
      expect.objectContaining({ name: 'Jane', company: 'ACME', not_company: false }),
    );
  });

  it('prefills the email of the user when there is no saved customer', () => {
    billing.getCustomer.mockReturnValue(of(null));
    service.loadCustomer().subscribe();

    expect(service.customer()).toBeUndefined();
    expect(service.customerForm.controls.email.value).toBe('user@example.test');
  });

  it('requires company and VAT only for companies', () => {
    service.customerForm.controls.not_company.setValue(true);
    expect(service.customerForm.controls.company.valid).toBe(true);
    expect(service.customerForm.controls.vat.valid).toBe(true);

    service.customerForm.controls.not_company.setValue(false);
    expect(service.customerForm.controls.company.valid).toBe(false);
    expect(service.customerForm.controls.vat.valid).toBe(false);
  });

  it('flags the VAT field only for a VAT 422 error, and shows any other error', () => {
    service.handleError({ status: 422, body: { detail: [{ loc: ['billing_details', 'name'] }] } });
    expect(service.customerForm.controls.vat.hasError('vat')).toBe(false);
    expect(showError).toHaveBeenCalledTimes(1);

    service.handleError({ status: 422, body: { detail: [{ loc: ['billing_details', 'vat'] }] } });
    expect(service.customerForm.controls.vat.hasError('vat')).toBe(true);
    expect(service.customerForm.controls.vat.touched).toBe(true);
    expect(showError).toHaveBeenCalledTimes(1);
  });

  it('shows the message of checkout errors and a generic one for the others', () => {
    service.handleError(new CheckoutError('billing.invalid_card'));
    expect(showError).toHaveBeenLastCalledWith('billing.invalid_card');

    service.handleError({ status: 500, message: 'Http failure' });
    expect(showError).toHaveBeenLastCalledWith(expect.stringContaining('generic.error.oops'));

    service.handleError(new TypeError('Failed to fetch'));
    expect(showError).toHaveBeenLastCalledWith(expect.stringContaining('generic.error.oops'));
  });

  it('emits the initial currency, then the one matching the country of the saved customer', () => {
    const currencies: string[] = [];
    service.currency$.subscribe((currency) => currencies.push(currency));
    service.prices$.subscribe();

    service.loadCustomer().subscribe();

    expect(currencies).toEqual(['USD', 'EUR']);
    expect(billing.getCurrency).toHaveBeenCalledWith('GB');
    expect(billing.getPrices).toHaveBeenCalledWith('USD');
    expect(billing.getPrices).toHaveBeenCalledWith('EUR');
  });
});
