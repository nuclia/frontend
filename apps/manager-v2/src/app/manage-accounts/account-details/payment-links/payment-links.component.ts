import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { SisToastService } from '@nuclia/sistema';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin, map, of, shareReplay, Subject, switchMap } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountTypes } from '@nuclia/core';
import { GlobalAccountService } from '../../global-account.service';
import { takeUntil } from 'rxjs/operators';
import { OptionModel } from '@guillotinaweb/pastanaga-angular';
import { SearchPrice } from '../../global-account.models';

@Component({
  templateUrl: './payment-links.component.html',
  styleUrls: ['./payment-links.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PaymentLinksComponent implements OnDestroy {
  private unsubscribeAll = new Subject<void>();

  paymentLinkForm = new FormGroup({
    accountType: new FormControl('v3growth', { nonNullable: true, validators: [Validators.required] }),
    licensedPrice: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    meteredPrice: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    formula: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    allowPromotionCode: new FormControl<boolean>(false, { nonNullable: true }),
  });

  isSaving = false;
  accountTypes: AccountTypes[] = ['v3growth', 'v3pro', 'v3enterprise', 'v3fly', 'v3starter'];
  paymentLink?: string;

  licensedPrices = of(this.accountTypes).pipe(
    switchMap((accountTypes) =>
      forkJoin(accountTypes.map((accountType) => this.globalService.getSearchPrice('licensed', accountType))),
    ),
    map((prices) =>
      prices.reduce(
        (acc, curr, index) => ({ ...acc, [this.accountTypes[index]]: curr }),
        {} as { [id in AccountTypes]: SearchPrice },
      ),
    ),
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
    shareReplay(1),
  );
  formulasOptions = this.globalService.getBillingFormulas().pipe(
    map((formulas) =>
      formulas.map(
        (formula) =>
          new OptionModel({ id: formula.id, value: formula.id, label: formula.title, help: formula.description }),
      ),
    ),
    shareReplay(1),
  );

  get accountTypeValue() {
    return this.paymentLinkForm.controls.accountType.value as AccountTypes;
  }

  constructor(
    private store: ManagerStore,
    private globalService: GlobalAccountService,
    private toast: SisToastService,
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
