import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { CheckoutService } from '../checkout/checkout.service';
import { SubscriptionService } from '../subscription.service';
import { CheckoutContextBoxComponent } from './checkout-context-box.component';

describe('CheckoutContextBoxComponent', () => {
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
  let fixture: ComponentFixture<CheckoutContextBoxComponent>;
  let component: CheckoutContextBoxComponent;
  let checkoutService: CheckoutService;
  let createToken: Mock;
  let billing: {
    isContextBoxPaymentRequired: Observable<boolean>;
    getCustomer: Mock;
    createCustomer: Mock;
    modifyCustomer: Mock;
    createPaymentMethod: Mock;
    createSubscription: Mock;
    getCurrency: Mock;
    getPrices: Mock;
  };
  let openModal: Mock;
  let showError: Mock;
  let showSuccess: Mock;
  let navigateExternal: Mock;
  let logout: Mock;
  let openConfirm: Mock;
  let closeConfirm: Subject<boolean>;
  let setAccount: Mock;

  function reviewWith(confirmed: boolean) {
    openModal.mockReturnValue({ onClose: of(confirmed), onDismiss: EMPTY });
  }

  async function submit() {
    checkoutService.submit(component['strategy']);
    await vi.runAllTimersAsync();
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(CheckoutService.prototype, 'initStripe').mockImplementation(() => undefined);
    openModal = vi.fn();
    showError = vi.fn();
    showSuccess = vi.fn();
    navigateExternal = vi.fn();
    logout = vi.fn();
    closeConfirm = new Subject<boolean>();
    openConfirm = vi.fn().mockReturnValue({ onClose: closeConfirm });
    setAccount = vi.fn();
    createToken = vi.fn().mockResolvedValue({ token });
    billing = {
      isContextBoxPaymentRequired: of(true),
      getCustomer: vi.fn().mockReturnValue(of(customer)).mockReturnValueOnce(of(null)),
      createCustomer: vi.fn().mockReturnValue(of(customer)),
      modifyCustomer: vi.fn().mockReturnValue(of(undefined)),
      createPaymentMethod: vi.fn().mockReturnValue(of({ payment_method_id: 'payment-method' })),
      createSubscription: vi.fn().mockReturnValue(of({ status: 'active' })),
      getCurrency: vi.fn().mockReturnValue(of('USD')),
      getPrices: vi.fn().mockReturnValue(of({ cowork: { recurring: { month: { price: 29 } }, usage: {} } })),
    };
    const account = { type: 'cowork', workflow: 'cowork', slug: 'context-box' };
    await TestBed.configureTestingModule({
      imports: [CheckoutContextBoxComponent],
      providers: [
        { provide: BillingService, useValue: billing },
        {
          provide: AccountEntryContextService,
          useValue: { getReturnUrl: () => 'https://rag.stashify.cloud/workspace' },
        },
        {
          provide: SDKService,
          useValue: {
            currentAccount: of(account),
            nuclia: { auth: { logout }, db: { getAccount: vi.fn().mockReturnValue(of(account)) } },
            set account(value: unknown) {
              setAccount(value);
            },
          },
        },
        { provide: UserService, useValue: { userPrefs: of({ email: 'designer@example.test' }) } },
        {
          provide: NavigationService,
          useValue: {
            navigateExternal,
          },
        },
        { provide: SisModalService, useValue: { openModal, openConfirm } },
        { provide: SisToastService, useValue: { error: showError, success: showSuccess } },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: SubscriptionService, useValue: { initialCurrency: of('USD') } },
      ],
    })
      .overrideComponent(CheckoutContextBoxComponent, { set: { template: '', imports: [] } })
      .compileComponents();
    fixture = TestBed.createComponent(CheckoutContextBoxComponent);
    component = fixture.componentInstance;
    checkoutService = fixture.debugElement.injector.get(CheckoutService);
    (checkoutService as any).stripe = { createToken };
    checkoutService.customerForm.patchValue({ ...customer.billing_details, not_company: true });
    checkoutService.cardName.setValue('Designer');
    checkoutService.validCard.set(true);
    reviewWith(false);
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not prepare a subscription until billing and card fields are valid', () => {
    checkoutService.customerForm.controls.name.setValue('');
    component.review();

    expect(checkoutService.customerForm.controls.name.touched).toBe(true);
    expect(billing.createCustomer).not.toHaveBeenCalled();
    expect(createToken).not.toHaveBeenCalled();
    expect(openModal).not.toHaveBeenCalled();
  });

  it('submits the checkout with its strategy', () => {
    const submitSpy = vi.spyOn(checkoutService, 'submit').mockImplementation(() => undefined);
    component.review();

    expect(submitSpy).toHaveBeenCalledWith(component['strategy']);
  });

  it('asks for confirmation before logging out when payment is required', () => {
    component.cancel();

    expect(openConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'billing.context-box.cancel-title',
        description: 'billing.context-box.cancel-description',
      }),
    );
    expect(logout).not.toHaveBeenCalled();

    closeConfirm.next(true);

    expect(logout).toHaveBeenCalled();
    expect(navigateExternal).not.toHaveBeenCalled();
    expect(billing.createCustomer).not.toHaveBeenCalled();
    expect(billing.createPaymentMethod).not.toHaveBeenCalled();
  });

  it('stays on the page when the logout confirmation is declined', () => {
    component.cancel();
    closeConfirm.next(false);

    expect(logout).not.toHaveBeenCalled();
    expect(navigateExternal).not.toHaveBeenCalled();
  });

  it('returns to the return url without confirmation when payment is not required', () => {
    component.isPaymentRequired = signal(false) as any;
    component.cancel();

    expect(openConfirm).not.toHaveBeenCalled();
    expect(navigateExternal).toHaveBeenCalledWith('https://rag.stashify.cloud/workspace');
    expect(logout).not.toHaveBeenCalled();
  });

  it('does nothing while a review or payment is in progress', () => {
    checkoutService.loading.set(true);
    component.cancel();

    expect(openConfirm).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
    expect(navigateExternal).not.toHaveBeenCalled();
  });

  it('saves billing and card details once, but does not subscribe before confirmation', async () => {
    // double-click guard check
    await Promise.all([submit(), submit()]);

    expect(billing.createCustomer).toHaveBeenCalledTimes(1);
    expect(createToken).toHaveBeenCalledWith(undefined, {
      name: 'Designer',
      address_country: 'GB',
      address_zip: 'SW1A 1AA',
    });
    expect(billing.createPaymentMethod).toHaveBeenCalledWith({ token: 'token' });
    expect(openModal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ contextBox: true, customer, token }) }),
    );
    expect(billing.createSubscription).not.toHaveBeenCalled();
    expect(checkoutService.loading()).toBe(false);
    expect(checkoutService.customerForm.controls.name.value).toBe('Designer');
    expect(checkoutService.cardName.value).toBe('Designer');
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it('reuses the card token when reviewing again, but creates a new one if the card name changes', async () => {
    // token reuse check
    await submit();
    await submit();
    expect(createToken).toHaveBeenCalledTimes(1);

    checkoutService.cardName.setValue('Another Name');
    await submit();
    expect(createToken).toHaveBeenCalledTimes(2);
  });

  it('asks for confirmation before logging out while it is unknown whether payment is required', () => {
    component.isPaymentRequired = signal(undefined) as any;
    component.cancel();

    expect(openConfirm).toHaveBeenCalled();
    expect(navigateExternal).not.toHaveBeenCalled();
  });

  it('redirects after payment without updating the SDK account, which would swap the checkout out mid-flow', async () => {
    reviewWith(true);
    await submit();

    expect(billing.createSubscription).toHaveBeenCalledWith({
      payment_method_id: 'payment-method',
      on_demand_budget: null,
      account_type: 'cowork',
      billing_interval: 'month',
    });
    expect(setAccount).not.toHaveBeenCalled();
    expect(showSuccess).toHaveBeenCalledWith('billing.success');
    expect(navigateExternal).toHaveBeenCalledWith('https://rag.stashify.cloud/workspace');
  });

  it('shows an error and does not redirect when the subscription is rejected', async () => {
    billing.createSubscription.mockReturnValue(
      throwError(() => ({ body: { error_code: 'STRIPE_SUBSCRIPTION_WITHOUT_PRICING' } })),
    );
    reviewWith(true);
    await submit();

    expect(showError).toHaveBeenCalledWith('billing.unknown_error');
    expect(navigateExternal).not.toHaveBeenCalled();
    expect(checkoutService.loading()).toBe(false);
  });

  it('keeps VAT failures on the billing form without attempting to save a card', () => {
    billing.createCustomer.mockReturnValue(
      throwError(() => ({ status: 422, body: { detail: [{ loc: ['billing_details', 'vat'] }] } })),
    );
    component.review();

    expect(checkoutService.customerForm.controls.vat.hasError('vat')).toBe(true);
    expect(checkoutService.customerForm.controls.vat.touched).toBe(true);
    expect(createToken).not.toHaveBeenCalled();
    expect(openModal).not.toHaveBeenCalled();
    expect(checkoutService.loading()).toBe(false);
  });

  it('preserves entered details after a declined card and lets the user retry', async () => {
    createToken.mockResolvedValueOnce({ error: { message: 'Card declined' } });
    await submit();

    expect(showError).toHaveBeenCalledWith('Card declined');
    expect(checkoutService.loading()).toBe(false);
    expect(checkoutService.customerForm.controls.address.value).toBe('1 Preview Street');
    expect(checkoutService.cardName.value).toBe('Designer');
    expect(openModal).not.toHaveBeenCalled();

    await submit();

    expect(billing.createCustomer).toHaveBeenCalledTimes(1);
    expect(billing.modifyCustomer).toHaveBeenCalledTimes(1);
    expect(openModal).toHaveBeenCalledTimes(1);
  });

  it('reviews current pricing for the saved billing country, not cached checkout pricing', async () => {
    const prices = { cowork: { recurring: { month: { price: 31 } }, usage: {} } };
    billing.getCurrency.mockReturnValue(of('EUR'));
    billing.getPrices.mockReturnValue(of(prices));
    await submit();

    expect(billing.getCurrency).toHaveBeenCalledWith('GB');
    expect(openModal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ currency: 'EUR', prices: prices.cowork }) }),
    );
  });

  it('does not open an unpriced review when pricing is unavailable', async () => {
    billing.getPrices.mockReturnValue(of({}));
    await submit();

    expect(openModal).not.toHaveBeenCalled();
    expect(showError).toHaveBeenCalledWith('billing.unknown_error');
    expect(checkoutService.loading()).toBe(false);
  });
});
