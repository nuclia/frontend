import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import {
  AccountEntryContextService,
  BillingService,
  NavigationService,
  SDKService,
  StripeCustomer,
  UserService,
} from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { Observable, of, Subject, throwError } from 'rxjs';
import { SubscriptionService } from '../subscription.service';
import { CheckoutComponent } from './checkout.component';

describe('CheckoutComponent Context Box activation', () => {
  const customer: StripeCustomer = {
    customer_id: 'customer',
    billing_details: {
      name: 'Designer',
      email: 'designer@example.test',
      phone: '+44 7700 900000',
      is_company: false,
      address: '1 Preview Street',
      city: 'London',
      postal_code: 'SW1A 1AA',
      country: 'GB',
    },
  };
  const token = { id: 'token', card: { brand: 'Visa', last4: '4242' } };
  let fixture: ComponentFixture<CheckoutComponent>;
  let component: CheckoutComponent;
  let closeReview: Subject<boolean>;
  let dismissReview: Subject<void>;
  let createToken: jest.Mock;
  let billing: {
    isContextBoxActivation: Observable<boolean>;
    isSubscribedToStripe: Observable<boolean>;
    getCustomer: jest.Mock;
    createCustomer: jest.Mock;
    modifyCustomer: jest.Mock;
    createPaymentMethod: jest.Mock;
    createSubscription: jest.Mock;
    getCurrency: jest.Mock;
    getPrices: jest.Mock;
  };
  let openModal: jest.Mock;
  let showError: jest.Mock;
  let getReturnUrl: jest.Mock;
  let navigateExternal: jest.Mock;

  beforeEach(async () => {
    jest.spyOn(CheckoutComponent.prototype, 'initStripe').mockImplementation(jest.fn());
    closeReview = new Subject<boolean>();
    dismissReview = new Subject<void>();
    openModal = jest.fn().mockReturnValue({ onClose: closeReview, onDismiss: dismissReview });
    showError = jest.fn();
    getReturnUrl = jest.fn().mockReturnValue('https://rag.stashify.cloud/workspace');
    navigateExternal = jest.fn();
    createToken = jest.fn().mockResolvedValue({ token });
    billing = {
      isContextBoxActivation: of(true),
      isSubscribedToStripe: of(false),
      getCustomer: jest.fn().mockReturnValue(of(customer)).mockReturnValueOnce(of(null)),
      createCustomer: jest.fn().mockReturnValue(of(customer)),
      modifyCustomer: jest.fn().mockReturnValue(of(undefined)),
      createPaymentMethod: jest.fn().mockReturnValue(of({ payment_method_id: 'payment-method' })),
      createSubscription: jest.fn(),
      getCurrency: jest.fn().mockReturnValue(of('USD')),
      getPrices: jest.fn().mockReturnValue(of({ cowork: { recurring: { month: { price: 29 } }, usage: {} } })),
    };
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: BillingService, useValue: billing },
        { provide: AccountEntryContextService, useValue: { getReturnUrl } },
        {
          provide: SDKService,
          useValue: { currentAccount: of({ type: 'cowork', workflow: 'cowork', slug: 'context-box' }) },
        },
        { provide: UserService, useValue: { userPrefs: of({ email: 'designer@example.test' }) } },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: NavigationService, useValue: { contextBoxMode: of(true), navigateExternal } },
        { provide: SisModalService, useValue: { openModal } },
        { provide: SisToastService, useValue: { error: showError } },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: SubscriptionService, useValue: { initialCurrency: of('USD') } },
      ],
    })
      .overrideComponent(CheckoutComponent, { set: { template: '', imports: [] } })
      .compileComponents();
    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    Object.defineProperty(component, '_stripe', { value: { createToken } });
    component.customerForm.patchValue({ ...customer.billing_details, not_company: true });
    component.updateCustomerValidation(component.customerForm.getRawValue());
    component.cardName.setValue('Designer');
    component.validCard = true;
  });

  afterEach(() => {
    fixture.destroy();
    jest.restoreAllMocks();
  });

  it('does not prepare a subscription until billing and card fields are valid', () => {
    component.customerForm.controls.name.setValue('');
    component.reviewActivation();

    expect(component.customerForm.controls.name.touched).toBe(true);
    expect(billing.createCustomer).not.toHaveBeenCalled();
    expect(createToken).not.toHaveBeenCalled();
    expect(openModal).not.toHaveBeenCalled();
  });

  it('cancels to the same home destination without saving billing or starting a subscription', () => {
    component.cancelActivation();

    expect(navigateExternal).toHaveBeenCalledWith('https://rag.stashify.cloud/workspace');
    expect(billing.createCustomer).not.toHaveBeenCalled();
    expect(billing.createPaymentMethod).not.toHaveBeenCalled();
    expect(billing.createSubscription).not.toHaveBeenCalled();
  });

  it('does not navigate away while a review or payment is in progress', () => {
    component.loading = true;
    component.cancelActivation();

    expect(navigateExternal).not.toHaveBeenCalled();
  });

  it('saves billing and card details once, but does not subscribe before confirmation', async () => {
    component.reviewActivation();
    component.reviewActivation();
    await Promise.resolve();

    expect(billing.createCustomer).toHaveBeenCalledTimes(1);
    expect(createToken).toHaveBeenCalledWith(undefined, {
      name: 'Designer',
      address_country: 'GB',
      address_zip: 'SW1A 1AA',
    });
    expect(billing.createPaymentMethod).toHaveBeenCalledWith({ token: 'token' });
    expect(openModal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ activation: true, customer, token }) }),
    );
    expect(billing.createSubscription).not.toHaveBeenCalled();
    expect(component.loading).toBe(true);

    dismissReview.next();

    expect(component.loading).toBe(false);
    expect(component.customerForm.controls.name.value).toBe('Designer');
    expect(component.cardName.value).toBe('Designer');
    expect(billing.createSubscription).not.toHaveBeenCalled();
  });

  it('keeps VAT failures on the billing form without attempting to save a card', () => {
    billing.createCustomer.mockReturnValue(
      throwError(() => ({ status: 422, body: { detail: [{ loc: ['billing_details', 'vat'] }] } })),
    );
    component.reviewActivation();

    expect(component.customerForm.controls.vat.hasError('vat')).toBe(true);
    expect(component.customerForm.controls.vat.touched).toBe(true);
    expect(createToken).not.toHaveBeenCalled();
    expect(openModal).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('preserves entered details after a declined card and lets the user retry', async () => {
    createToken.mockResolvedValueOnce({ error: { message: 'Card declined' } });
    component.reviewActivation();
    await Promise.resolve();

    expect(showError).toHaveBeenCalledWith('Card declined');
    expect(component.loading).toBe(false);
    expect(component.customerForm.controls.address.value).toBe('1 Preview Street');
    expect(component.cardName.value).toBe('Designer');
    expect(openModal).not.toHaveBeenCalled();

    component.reviewActivation();
    await Promise.resolve();

    expect(billing.createCustomer).toHaveBeenCalledTimes(1);
    expect(billing.modifyCustomer).toHaveBeenCalledTimes(1);
    expect(openModal).toHaveBeenCalledTimes(1);
    expect(billing.createSubscription).not.toHaveBeenCalled();
  });

  it('reviews current pricing for the saved billing country, not cached checkout pricing', async () => {
    const prices = { cowork: { recurring: { month: { price: 31 } }, usage: {} } };
    billing.getCurrency.mockReturnValue(of('EUR'));
    billing.getPrices.mockReturnValue(of(prices));
    component.reviewActivation();
    await Promise.resolve();

    expect(billing.getCurrency).toHaveBeenCalledWith('GB');
    expect(openModal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ currency: 'EUR', prices: prices.cowork }) }),
    );
  });

  it('does not open an unpriced activation review when pricing is unavailable', async () => {
    billing.getPrices.mockReturnValue(of({}));
    component.reviewActivation();
    await Promise.resolve();

    expect(openModal).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith('billing.unknown_error');
    expect(component.loading).toBe(false);
  });
});
