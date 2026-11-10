import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { toast } from '@spartan-ng/brain/sonner';
import { map, Observable } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import {
  ActionOnBudgetExhausted,
  CloudZeroSubscriptionPayload,
  ManagerAccountSubscription,
  ManagerSubscriptionDetails,
  ManualSubscriptionPayload,
  ProductCatalog,
} from '../../global-account.models';
import { GlobalAccountService } from '../../global-account.service';
import { getOptionLabel } from '../account-details.utils';
import { SelectOption, SubscriptionState } from './subscriptions.model';
import {
  ACTION_ON_BUDGET_OPTIONS,
  buildBasePayload,
  CLOUD_ZERO_FORMULA_ID,
  getBusinessUnitOptions,
  getProductLineOptions,
  getProductOptions,
  hasBudget,
  MANUAL_FORMULA_ID,
} from './subscriptions.utils';

@Injectable()
export class SubscriptionsService {
  private store = inject(ManagerStore);
  private globalService = inject(GlobalAccountService);
  private destroyRef = inject(DestroyRef);

  private accountId = this.store.getAccountId() || '';

  private _subscriptionState = signal<SubscriptionState>('loading');
  private _existingProvider = signal<string>('');
  private _isSavingCloudZero = signal(false);
  private _isSavingManual = signal(false);
  private _isDeletingCloudZero = signal(false);
  private _isDeletingManual = signal(false);
  private _cloudZeroShowAction = signal(false);
  private _manualShowAction = signal(false);
  private _productCatalog = signal<ProductCatalog>({});

  subscriptionState = this._subscriptionState.asReadonly();
  existingProvider = this._existingProvider.asReadonly();
  isSavingCloudZero = this._isSavingCloudZero.asReadonly();
  isSavingManual = this._isSavingManual.asReadonly();
  isDeletingCloudZero = this._isDeletingCloudZero.asReadonly();
  isDeletingManual = this._isDeletingManual.asReadonly();
  cloudZeroShowAction = this._cloudZeroShowAction.asReadonly();
  manualShowAction = this._manualShowAction.asReadonly();

  cloudZeroForm = new FormGroup({
    nuclia_tokens_price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    billing_formula_id: new FormControl<string>(CLOUD_ZERO_FORMULA_ID, { nonNullable: true }),
    free_tokens_per_billing_cycle: new FormControl<number | null>(null),
    free_storage_nuclia_tokens: new FormControl<number | null>(null),
    on_demand_budget: new FormControl<number | null>(null),
    action_on_budget_exhausted: new FormControl<ActionOnBudgetExhausted | null>(null),
    product: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    product_line: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    business_unit: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  manualForm = new FormGroup({
    nuclia_tokens_price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    billing_formula_id: new FormControl<string>(MANUAL_FORMULA_ID, { nonNullable: true }),
    free_tokens_per_billing_cycle: new FormControl<number | null>(null),
    free_storage_nuclia_tokens: new FormControl<number | null>(null),
    on_demand_budget: new FormControl<number | null>(null),
    action_on_budget_exhausted: new FormControl<ActionOnBudgetExhausted | null>(null),
  });

  actionOnBudgetOptions = ACTION_ON_BUDGET_OPTIONS;

  formulasOptions = toSignal(
    this.globalService.getBillingFormulas().pipe(
      map((formulas) =>
        formulas.map(
          (formula): SelectOption => ({
            value: formula.id,
            label: formula.title,
            description: formula.description,
          }),
        ),
      ),
    ),
    { initialValue: [] as SelectOption[] },
  );

  businessUnit = toSignal(this.cloudZeroForm.controls.business_unit.valueChanges, { initialValue: '' });
  productLine = toSignal(this.cloudZeroForm.controls.product_line.valueChanges, { initialValue: '' });
  businessUnitOptions = computed(() => getBusinessUnitOptions(this._productCatalog()));
  productLineOptions = computed(() => getProductLineOptions(this._productCatalog(), this.businessUnit()));
  productOptions = computed(() => getProductOptions(this._productCatalog(), this.businessUnit(), this.productLine()));

  readonly formulaLabel = (value: string) => getOptionLabel(this.formulasOptions(), value);
  readonly businessUnitLabel = (value: string) => getOptionLabel(this.businessUnitOptions(), value);
  readonly productLineLabel = (value: string) => getOptionLabel(this.productLineOptions(), value);
  readonly productLabel = (value: string) => getOptionLabel(this.productOptions(), value);
  readonly actionOnBudgetLabel = (value: ActionOnBudgetExhausted) => getOptionLabel(this.actionOnBudgetOptions, value);

  constructor() {
    this.setupBudgetCoupling(this.cloudZeroForm, true);
    this.setupBudgetCoupling(this.manualForm, false);
    this.loadSubscription();
    this.loadProductCatalog();
  }

  createCloudZeroSubscription(): void {
    if (this.cloudZeroForm.invalid) return;
    this.performAction(
      this.globalService.createCloudZeroSubscription(this.accountId, this.buildCloudZeroPayload()),
      (v) => this._isSavingCloudZero.set(v),
      {
        success: 'Cloud Zero subscription created successfully',
        error: 'Failed to create Cloud Zero subscription',
        conflict: 'A subscription already exists for this account',
      },
      () => this.loadSubscription(),
    );
  }

  createManualSubscription(): void {
    if (this.manualForm.invalid) return;
    this.performAction(
      this.globalService.createManualSubscription(this.accountId, this.buildManualPayload()),
      (v) => this._isSavingManual.set(v),
      {
        success: 'Manual subscription created successfully',
        error: 'Failed to create Manual subscription',
        conflict: 'A subscription already exists for this account',
      },
      () => this.loadSubscription(),
    );
  }

  updateCloudZeroSubscription(): void {
    if (this.cloudZeroForm.invalid) return;
    this.performAction(
      this.globalService.patchCloudZeroSubscription(this.accountId, this.buildCloudZeroPayload()),
      (v) => this._isSavingCloudZero.set(v),
      { success: 'Cloud Zero subscription updated successfully', error: 'Failed to update Cloud Zero subscription' },
      () => this.cloudZeroForm.markAsPristine(),
    );
  }

  updateManualSubscription(): void {
    if (this.manualForm.invalid) return;
    this.performAction(
      this.globalService.patchManualSubscription(this.accountId, this.buildManualPayload()),
      (v) => this._isSavingManual.set(v),
      { success: 'Manual subscription updated successfully', error: 'Failed to update Manual subscription' },
      () => this.manualForm.markAsPristine(),
    );
  }

  confirmDelete(type: 'cloud_zero' | 'manual'): void {
    const isCloudZero = type === 'cloud_zero';
    const label = isCloudZero ? 'Cloud Zero' : 'Manual';
    const observable = isCloudZero
      ? this.globalService.deleteCloudZeroSubscription(this.accountId)
      : this.globalService.deleteManualSubscription(this.accountId);

    this.performAction(
      observable,
      (v) => (isCloudZero ? this._isDeletingCloudZero.set(v) : this._isDeletingManual.set(v)),
      { success: `${label} subscription deleted`, error: `Failed to delete ${label} subscription` },
      () => {
        if (isCloudZero) {
          this.cloudZeroForm.reset();
        } else {
          this.manualForm.reset();
        }
        this.loadSubscription();
      },
    );
  }

  onBusinessUnitChange(value: string | null | undefined) {
    // The select also emits when the form writes a value; only a user pick differs from the control value
    if (value === this.cloudZeroForm.controls.business_unit.value) {
      return;
    }
    this.cloudZeroForm.controls.product_line.reset();
    this.cloudZeroForm.controls.product.reset();
  }

  onProductLineChange(value: string | null | undefined) {
    if (value === this.cloudZeroForm.controls.product_line.value) {
      return;
    }
    this.cloudZeroForm.controls.product.reset();
  }

  private setBudgetAction(isCloudZero: boolean, show: boolean) {
    (isCloudZero ? this._cloudZeroShowAction : this._manualShowAction).set(show);
  }

  private setupBudgetCoupling(form: FormGroup, isCloudZero: boolean): void {
    const budgetCtrl = form.controls['on_demand_budget'];
    const actionCtrl = form.controls['action_on_budget_exhausted'];

    this.setBudgetAction(isCloudZero, hasBudget(budgetCtrl.value));

    budgetCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      const show = hasBudget(val);
      this.setBudgetAction(isCloudZero, show);
      if (!show) {
        actionCtrl.setValue(null, { emitEvent: false });
      } else if (!actionCtrl.value) {
        actionCtrl.setValue('WARN_ACCOUNT_OWNER', { emitEvent: false });
      }
    });
  }

  private populateForm(form: FormGroup, data: ManagerSubscriptionDetails, isCloudZero: boolean): void {
    form.patchValue({ ...data });
    this.setBudgetAction(isCloudZero, hasBudget(form.controls['on_demand_budget'].value));
    form.markAsPristine();
  }

  private loadSubscription(): void {
    this._subscriptionState.set('loading');
    this.globalService
      .getAccountSubscription(this.accountId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ManagerAccountSubscription) => {
          if (response.provider === 'CLOUD_ZERO') {
            this._subscriptionState.set('cloud_zero');
            this.populateForm(this.cloudZeroForm, response.subscription, true);
          } else if (response.provider === 'MANUAL') {
            this._subscriptionState.set('manual');
            this.populateForm(this.manualForm, response.subscription, false);
          } else {
            this._existingProvider.set(response.provider);
            this._subscriptionState.set('other');
          }
        },
        error: () => {
          this._subscriptionState.set('none');
        },
      });
  }

  private loadProductCatalog(): void {
    this.globalService
      .getProductCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this._productCatalog.set(data);
        },
        error: () => {
          // On stage the endpoint is not available, it return error.
          this._productCatalog.set({});
        },
      });
  }

  private buildCloudZeroPayload(): CloudZeroSubscriptionPayload {
    const raw = this.cloudZeroForm.getRawValue();
    return {
      ...buildBasePayload(raw),
      product: raw.product,
      product_line: raw.product_line,
      business_unit: raw.business_unit,
    };
  }

  private buildManualPayload(): ManualSubscriptionPayload {
    return buildBasePayload(this.manualForm.getRawValue());
  }

  private performAction(
    observable: Observable<void>,
    setLoading: (val: boolean) => void,
    messages: { success: string; error: string; conflict?: string },
    onSuccess?: () => void,
  ): void {
    setLoading(true);
    observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        setLoading(false);
        toast.success(messages.success);
        onSuccess?.();
      },
      error: (err) => {
        setLoading(false);
        const is409 = err?.status === 409;
        toast.error(is409 && messages.conflict ? messages.conflict : err?.body?.detail || messages.error);
      },
    });
  }
}
