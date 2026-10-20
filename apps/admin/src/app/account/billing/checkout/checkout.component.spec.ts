import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BillingService, NavigationService, SDKService, StripeCustomer, UserService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { BehaviorSubject, EMPTY, of, Subject, throwError } from 'rxjs';
import { SubscriptionService } from '../subscription.service';
import { CheckoutComponent } from './checkout.component';
import { CheckoutService } from './checkout.service';

describe('CheckoutComponent', () => {
  const customer: StripeCustomer = {
    customer_id: 'customer',
    billing_details: {
      name: 'Jane Doe',
      email: 'jane@example.test',
      phone: '+44 7700 900000',
      is_company: false,
      address: '1 Preview Street',
      city: 'London',
      postal_code: 'SW1A 1AA',
      country: 'GB',
    },
  };
  const token = { id: 'token', card: { brand: 'Visa', last4: '4242' } };
  const account = { type: 'stash-trial', slug: 'my-account' };
  let fixture: ComponentFixture<CheckoutComponent>;
  let component: CheckoutComponent;
  let checkoutService: CheckoutService;
  let queryParams: BehaviorSubject<Record<string, string>>;
  let closeReview: Subject<boolean>;
  let createToken: jest.Mock;
  let billing: Record<string, jest.Mock | unknown>;
  let openModal: jest.Mock;
  let showError: jest.Mock;
  let showSuccess: jest.Mock;
  let navigateExternal: jest.Mock;
  let setAccount: jest.Mock;
  let storedCustomer: StripeCustomer | null;

  async function flushPromises() {
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  }

  async function createComponent(params: Record<string, string>) {
    queryParams.next(params);
    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    checkoutService = fixture.debugElement.injector.get(CheckoutService);
    await flushPromises();
  }

  function stripeWith(stripe: object) {
    (checkoutService as any).stripe = stripe;
  }

  async function preparePayment() {
    stripeWith({ createToken });
    checkoutService.cardName.setValue('Jane Doe');
    component.createPaymentMethod();
    await flushPromises();
  }

  beforeEach(async () => {
    jest.spyOn(CheckoutService.prototype, 'initStripe').mockImplementation();
    storedCustomer = null;
    queryParams = new BehaviorSubject<Record<string, string>>({});
    closeReview = new Subject<boolean>();
    openModal = jest.fn().mockReturnValue({ onClose: closeReview, onDismiss: EMPTY });
    showError = jest.fn();
    showSuccess = jest.fn();
    navigateExternal = jest.fn();
    setAccount = jest.fn();
    createToken = jest.fn().mockResolvedValue({ token });
    billing = {
      isSubscribedToStripe: of(true),
      getCustomer: jest.fn().mockImplementation(() => of(storedCustomer)),
      createCustomer: jest.fn().mockReturnValue(of(customer)),
      modifyCustomer: jest.fn().mockReturnValue(of(undefined)),
      createPaymentMethod: jest.fn().mockReturnValue(of({ payment_method_id: 'payment-method' })),
      createSubscription: jest.fn().mockReturnValue(of({ status: 'active' })),
      getCurrency: jest.fn().mockReturnValue(of('USD')),
      getPrices: jest.fn().mockReturnValue(
        of({
          v3starter: { recurring: { month: { price: 10 }, year: { price: 100 } }, usage: {} },
        }),
      ),
      saveBudget: jest.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: BillingService, useValue: billing },
        { provide: ActivatedRoute, useValue: { queryParams } },
        {
          provide: SDKService,
          useValue: {
            currentAccount: of(account),
            nuclia: { db: { getAccount: jest.fn().mockReturnValue(of({ ...account, type: 'v3starter' })) } },
            set account(value: unknown) {
              setAccount(value);
            },
          },
        },
        { provide: UserService, useValue: { userPrefs: of({ email: 'jane@example.test' }) } },
        {
          provide: NavigationService,
          useValue: {
            contextBoxMode: of(false),
            navigateExternal,
            getAccountManageUrl: (slug: string) => `/at/${slug}/manage`,
          },
        },
        { provide: SisModalService, useValue: { openModal } },
        { provide: SisToastService, useValue: { error: showError, success: showSuccess, warning: jest.fn() } },
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
        { provide: SubscriptionService, useValue: { initialCurrency: of('USD') } },
      ],
    })
      .overrideComponent(CheckoutComponent, { set: { template: '', imports: [] } })
      .compileComponents();
  });

  afterEach(() => {
    fixture.destroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('initialisation', () => {
    it('prefills the email and opens the billing form when subscribing without a customer', async () => {
      await createComponent({ type: 'v3starter' });

      expect(component.editCustomer).toBe(true);
      expect(component.billingDetailsEnabled).toBe(true);
      expect(checkoutService.customerForm.controls.email.value).toBe('jane@example.test');
      expect(checkoutService.customer()).toBeUndefined();
    });

    it('shows the saved customer and opens the card form when the customer already exists', async () => {
      storedCustomer = customer;
      await createComponent({ type: 'v3starter' });

      expect(checkoutService.customer()).toEqual(customer);
      expect(component.editCustomer).toBe(false);
      expect(component.editCard).toBe(true);
      expect(checkoutService.customerForm.controls.name.value).toBe('Jane Doe');
    });

    it('disables billing details for accounts without a customer outside of the subscription flow', async () => {
      await createComponent({});

      expect(component.billingDetailsEnabled).toBe(false);
    });

    it('does not treat the current account type as a plan to subscribe to', async () => {
      await createComponent({ type: 'stash-trial' });

      expect(await new Promise((resolve) => component.subscribeMode.subscribe(resolve))).toBe(false);
    });
  });

  describe('billing details', () => {
    it('creates the customer, closes the form and opens the card form', async () => {
      await createComponent({ type: 'v3starter' });
      checkoutService.customerForm.patchValue({ ...customer.billing_details, not_company: true });
      component.saveCustomer();

      expect(billing['createCustomer']).toHaveBeenCalledTimes(1);
      expect(checkoutService.customer()).toEqual(customer);
      expect(component.editCustomer).toBe(false);
      expect(component.editCard).toBe(true);
    });

    it('modifies the existing customer', async () => {
      storedCustomer = customer;
      await createComponent({ type: 'v3starter' });
      component.showCustomerForm();
      component.saveCustomer();

      expect(billing['modifyCustomer']).toHaveBeenCalledTimes(1);
      expect(billing['createCustomer']).not.toHaveBeenCalled();
      expect(component.editCustomer).toBe(false);
    });

    it('does not save an invalid form', async () => {
      await createComponent({ type: 'v3starter' });
      component.saveCustomer();

      expect(billing['createCustomer']).not.toHaveBeenCalled();
    });

    it('flags the VAT field when the backend rejects the VAT id', async () => {
      await createComponent({ type: 'v3starter' });
      checkoutService.customerForm.patchValue({ ...customer.billing_details, not_company: true });
      (billing['createCustomer'] as jest.Mock).mockReturnValue(
        throwError(() => ({ status: 422, body: { detail: [{ loc: ['billing_details', 'vat'] }] } })),
      );
      component.saveCustomer();

      expect(checkoutService.customerForm.controls.vat.hasError('vat')).toBe(true);
      expect(showError).not.toHaveBeenCalled();
      expect(component.editCustomer).toBe(true);
    });

    it('shows a generic error for any other failure', async () => {
      await createComponent({ type: 'v3starter' });
      checkoutService.customerForm.patchValue({ ...customer.billing_details, not_company: true });
      (billing['createCustomer'] as jest.Mock).mockReturnValue(throwError(() => ({ status: 500 })));
      component.saveCustomer();

      expect(showError).toHaveBeenCalledTimes(1);
      expect(component.editCustomer).toBe(true);
    });
  });

  describe('card', () => {
    it('keeps the card token and closes the card form', async () => {
      storedCustomer = customer;
      await createComponent({ type: 'v3starter' });
      await preparePayment();

      expect(createToken).toHaveBeenCalledWith(undefined, {
        name: 'Jane Doe',
        address_country: 'GB',
        address_zip: 'SW1A 1AA',
      });
      expect(billing['createPaymentMethod']).toHaveBeenCalledWith({ token: 'token' });
      expect(checkoutService.token()).toEqual(token);
      expect(component.editCard).toBe(false);
      expect(checkoutService.loading()).toBe(false);
    });

    it('reports a declined card and stays on the card form', async () => {
      storedCustomer = customer;
      await createComponent({ type: 'v3starter' });
      createToken.mockResolvedValueOnce({ error: { message: 'Card declined' } });
      await preparePayment();

      expect(showError).toHaveBeenCalledWith('Card declined');
      expect(checkoutService.token()).toBeUndefined();
      expect(component.editCard).toBe(true);
      expect(checkoutService.loading()).toBe(false);
    });
  });

  describe('subscription', () => {
    beforeEach(async () => {
      storedCustomer = customer;
      await createComponent({ type: 'v3starter' });
      await preparePayment();
    });

    it('opens the review with the selected plan and the card token', async () => {
      component.doSubscribe();
      await flushPromises();

      expect(openModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({
            account: 'v3starter',
            customer,
            token,
            currency: 'USD',
            budget: null,
          }),
        }),
      );
      expect(billing['createSubscription']).not.toHaveBeenCalled();
    });

    it('does not subscribe when the review is dismissed', async () => {
      component.doSubscribe();
      await flushPromises();
      closeReview.next(false);
      await flushPromises();

      expect(billing['createSubscription']).not.toHaveBeenCalled();
      expect(checkoutService.loading()).toBe(false);
    });

    it('subscribes monthly with the chosen budget, updates the account and goes back to billing', async () => {
      jest.useFakeTimers();
      component.budget = { on_demand_budget: 250 };
      component.doSubscribe();
      await flushPromises();
      closeReview.next(true);
      await flushPromises();
      expect(checkoutService.loading()).toBe(true);
      jest.advanceTimersByTime(2000);
      await flushPromises();

      expect(billing['createSubscription']).toHaveBeenCalledWith({
        payment_method_id: 'payment-method',
        on_demand_budget: 250,
        account_type: 'v3starter',
        billing_interval: 'month',
      });
      expect(setAccount).toHaveBeenCalledWith(expect.objectContaining({ type: 'v3starter' }));
      expect(showSuccess).toHaveBeenCalledWith('billing.success');
      expect(navigateExternal).toHaveBeenCalledWith('/at/my-account/manage/billing');
    });

    it('subscribes yearly when the plan has no monthly price', async () => {
      jest.useFakeTimers();
      (billing['getPrices'] as jest.Mock).mockReturnValue(
        of({ v3starter: { recurring: { year: { price: 100 } }, usage: {} } }),
      );
      await createComponent({ type: 'v3starter' });
      await preparePayment();
      component.doSubscribe();
      await flushPromises();
      closeReview.next(true);
      await flushPromises();
      jest.advanceTimersByTime(2000);
      await flushPromises();

      expect(billing['createSubscription']).toHaveBeenCalledWith(expect.objectContaining({ billing_interval: 'year' }));
    });

    it('reopens the card form and forgets the card when the payment method is rejected', async () => {
      (billing['createSubscription'] as jest.Mock).mockReturnValue(
        throwError(() => ({ body: { error_code: 'payment_method_not_attached' } })),
      );
      component.doSubscribe();
      await flushPromises();
      closeReview.next(true);
      await flushPromises();

      expect(showError).toHaveBeenCalledWith('billing.invalid_card');
      expect(component.editCard).toBe(true);
      expect(checkoutService.token()).toBeUndefined();
      expect(checkoutService.loading()).toBe(false);
      expect(navigateExternal).not.toHaveBeenCalled();
    });

    it('reopens the billing form when the address is rejected', async () => {
      (billing['createSubscription'] as jest.Mock).mockReturnValue(
        throwError(() => ({ body: { error_code: 'customer_tax_location_invalid' } })),
      );
      component.doSubscribe();
      await flushPromises();
      closeReview.next(true);
      await flushPromises();

      expect(showError).toHaveBeenCalledWith('billing.invalid_address');
      expect(component.editCustomer).toBe(true);
      expect(checkoutService.token()).toEqual(token);
      expect(checkoutService.loading()).toBe(false);
    });
  });
});
