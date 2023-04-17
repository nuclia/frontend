import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { delay, filter, forkJoin, from, switchMap, take, tap } from 'rxjs';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { injectScript, SDKService, StateService } from '@flaps/core';
import { BillingService } from '../billing.service';
import { StripeCustomer } from '../billing.models';
import { COUNTRIES } from '../utils';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { AccountTypes } from '@nuclia/core';
import { NavigationService } from '@flaps/common';
import { ReviewComponent } from '../review/review.component';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  billing = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    company: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    vat: new FormControl<string>('', { nonNullable: true }),
    address: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    state: new FormControl<string>('', { nonNullable: true }),
    city: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    postal_code: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  cardName = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  budget = new FormControl<string>('0', { nonNullable: true, validators: [Validators.required, Validators.min(0)] });

  errors: IErrorMessages = {
    required: 'validation.required',
  };

  subscribing = false;
  accountType?: AccountTypes;
  countries = COUNTRIES;
  countryList = Object.entries(COUNTRIES)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  editCustomer = true;
  customer?: StripeCustomer;

  private _stripe: any;
  @ViewChild('card') private cardContainer?: ElementRef;
  card: any;
  cardError: string = '';
  validCard = false;
  editCard = false;
  token?: any;

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private sdk: SDKService,
    private stateService: StateService,
    private route: ActivatedRoute,
    private router: Router,
    private navigation: NavigationService,
    private modalService: SisModalService,
  ) {
    this.initForms();
    this.initStripe();
  }

  ngOnInit() {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      this.accountType = params['type'];
    });
  }

  initForms() {
    forkJoin([this.billingService.getCustomer(), this.billingService.country.pipe(take(1))]).subscribe(
      ([customer, country]) => {
        if (customer) {
          this.customer = customer;
          this.billing.patchValue(customer.billing_details);
          this.editCustomer = false;
          this.editCard = true;
          this.cdr?.markForCheck();
        } else if (country) {
          this.billing.patchValue({ country });
        }
      },
    );
    this.billingService.budgetEstimation.pipe(take(1)).subscribe((budget) => {
      this.budget.setValue(budget.toString());
    });
  }

  showCustomerForm() {
    this.editCustomer = true;
    this.cdr?.markForCheck();
  }

  saveCustomer() {
    if (this.billing.invalid) return;
    const observable = this.customer
      ? this.billingService
          .modifyCustomer(this.billing.getRawValue())
          .pipe(switchMap(() => this.billingService.getCustomer()))
      : this.billingService.createCustomer(this.billing.getRawValue());
    observable.subscribe((customer) => {
      if (customer) {
        this.customer = customer;
        this.billing.reset();
        this.billing.patchValue(customer.billing_details);
        this.editCustomer = false;
        if (!this.token) {
          this.editCard = true;
        }
        this.cdr?.markForCheck();
      }
    });
  }

  initStripe() {
    injectScript('https://js.stripe.com/v3/')
      .pipe(
        take(1),
        filter((result) => !!result),
        switchMap(() => this.billingService.getStripePublicKey()),
      )
      .subscribe((key) => {
        this._stripe = (window as any)['Stripe'](key.public_key);
        this.createCardElement();
      });
  }

  createCardElement() {
    const elements = this._stripe.elements();
    this.card = elements.create('card', { hidePostalCode: true });
    this.card.mount(this.cardContainer!.nativeElement);
    this.card.on('change', (event: any) => {
      this.validCard = !event.error && event.complete;
      this.cardError = event.error ? event.error.message : '';
      this.cdr.markForCheck();
    });
  }

  getToken() {
    from(
      this._stripe.createToken(this.card, {
        name: this.cardName.value,
        address_country: this.customer?.billing_details.country,
        address_zip: this.customer?.billing_details.postal_code,
      }),
    ).subscribe((data: any) => {
      if (data.error) {
        this.toaster.error(data.error.message);
      } else if (data.token) {
        this.token = data.token;
        this.editCard = false;
        this.cdr.markForCheck();
      }
    });
  }

  showCardForm() {
    this.editCard = true;
    this.cdr?.markForCheck();
  }

  subscribe() {
    if (!this.accountType) return;
    this.openReview()
      .pipe(
        take(1),
        filter((result) => !!result),
        tap(() => {
          this.subscribing = true;
          this.cdr?.markForCheck();
        }),
        switchMap(() =>
          this.billingService.createSubscription({
            payment_method_id: this.token.id,
            on_demand_budget: parseInt(this.budget.value),
            account_type: this.accountType!,
          }),
        ),
        switchMap(() =>
          this.sdk.currentAccount.pipe(
            take(1),
            delay(2000), // Need to wait for the updated account data to be available
          ),
        ),
        switchMap((account) => this.sdk.nuclia.db.getAccount(account.slug)),
        tap((newAccount) => this.stateService.setAccount(newAccount)),
      )
      .subscribe({
        next: (newAccount) => {
          this.toaster.success('billing.success');
          this.router.navigateByUrl(this.navigation.getAccountUrl(newAccount.slug));
        },
        error: () => {
          this.subscribing = false;
          this.cdr?.markForCheck();
          this.toaster.error('generic.error.oops');
        },
      });
  }

  openReview() {
    return forkJoin([
      this.billingService.getPrices(),
      this.billingService.getCurrency(this.billing.value.country || ''),
    ]).pipe(
      switchMap(
        ([prices, currency]) =>
          this.modalService.openModal(ReviewComponent, {
            dismissable: true,
            data: {
              account: this.accountType,
              customer: this.customer,
              token: this.token,
              prices: prices[this.accountType!],
              budget: this.budget.value,
              currency,
            },
          }).onClose,
      ),
    );
  }
}
