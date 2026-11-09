import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountTypes } from '@nuclia/core';
import { UiOptionWithDescriptionImports } from '@nuclia/ui/option-with-description';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmAlertImports } from '@nuclia/ui-spartan/alert';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmCheckboxImports } from '@nuclia/ui-spartan/checkbox';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { forkJoin, map, of, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ManagerStore } from '../../../manager.store';
import { PaymentCurrency, SearchPrice } from '../../global-account.models';
import { GlobalAccountService } from '../../global-account.service';

@Component({
  templateUrl: './payment-links.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HlmAlertImports,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmFieldImports,
    HlmSelectImports,
    UiOptionWithDescriptionImports,
    AsyncPipe,
  ],
})
export class PaymentLinksComponent implements OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private labels = new Map<string, string>();

  paymentLinkForm = new FormGroup({
    accountType: new FormControl('v3growth', { nonNullable: true, validators: [Validators.required] }),
    licensedPrice: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    meteredPrice: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    formula: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    currency: new FormControl<PaymentCurrency>('usd', { nonNullable: true, validators: [Validators.required] }),
    allowPromotionCode: new FormControl<boolean>(false, { nonNullable: true }),
  });

  isSaving = false;
  accountTypes: AccountTypes[] = ['v3pro', 'v3enterprise', 'v3starter'];
  currencies: PaymentCurrency[] = ['usd', 'eur'];
  paymentLink?: string;

  licensedPrices = of(this.accountTypes).pipe(
    switchMap((accountTypes) =>
      forkJoin(accountTypes.map((accountType) => this.globalService.getSearchPrice('licensed', accountType))),
    ),
    map((prices) =>
      prices.reduce(
        (acc, curr, index) => ({ ...acc, [this.accountTypes[index]]: curr }),
        {} as { [id in AccountTypes]: SearchPrice[] },
      ),
    ),
    tap((prices) => Object.values(prices).forEach((list) => this.registerPrices(list))),
    shareReplay(1),
  );
  meteredPrices = this.globalService.getSearchPrice('metered').pipe(
    map((prices) =>
      [
        {
          id: 'opt-out',
          nickname: 'I don’t want to bill consumption for this client',
          product: 'opt-out',
        },
      ].concat(prices),
    ),
    tap((prices) => this.registerPrices(prices)),
    shareReplay(1),
  );
  formulas = this.globalService.getBillingFormulas().pipe(
    tap((formulas) => formulas.forEach((formula) => this.labels.set(formula.id, formula.title))),
    shareReplay(1),
  );

  readonly priceLabel = (id: string) => this.labels.get(id) ?? id;
  readonly formulaLabel = (id: string) => this.labels.get(id) ?? id;

  get accountTypeValue() {
    return this.paymentLinkForm.controls.accountType.value as AccountTypes;
  }

  constructor(
    private store: ManagerStore,
    private globalService: GlobalAccountService,
    private toast: UiToastService,
    private cdr: ChangeDetectorRef,
  ) {
    this.paymentLinkForm.controls.accountType.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.paymentLinkForm.controls.licensedPrice.reset();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private registerPrices(prices: SearchPrice[]) {
    prices.forEach((price) => this.labels.set(price.id, price.nickname));
  }

  create() {
    this.isSaving = true;
    this.cdr.markForCheck();
    const formValues = this.paymentLinkForm.getRawValue();
    this.globalService
      .createPaymentLink({
        account_id: this.store.getAccountId() || '',
        account_type: formValues.accountType as AccountTypes,
        price_ids: [formValues.licensedPrice, formValues.meteredPrice].filter((price) => price !== 'opt-out'),
        billing_formula_id: formValues.formula,
        allow_promotion_codes: formValues.allowPromotionCode,
        currency: formValues.currency,
      })
      .subscribe({
        next: (result) => {
          this.isSaving = false;
          this.paymentLink = result.url;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isSaving = false;
          this.toast.error(error?.body?.detail || 'Creating the payment link');
          this.cdr.markForCheck();
        },
      });
  }
}
