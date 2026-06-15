import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { OptionModel } from '@guillotinaweb/pastanaga-angular';
import { SisToastService } from '@nuclia/sistema';
import { map, Observable, shareReplay } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { GlobalAccountService } from '../../global-account.service';
import {
  ActionOnBudgetExhausted,
  BaseSubscriptionPayload,
  CloudZeroSubscriptionPayload,
  ManagerAccountSubscription,
  ManagerSubscriptionDetails,
  ManualSubscriptionPayload,
} from '../../global-account.models';

export type SubscriptionState = 'loading' | 'none' | 'cloud_zero' | 'manual' | 'other';

@Injectable()
export class SubscriptionsService {
  private store = inject(ManagerStore);
  private globalService = inject(GlobalAccountService);
  private toast = inject(SisToastService);
  private destroyRef = inject(DestroyRef);

  private accountId = this.store.getAccountId() || '';

  // ── Backing signals ──────────────────────────────────────────────────
  private _subscriptionState = signal<SubscriptionState>('loading');
  private _existingProvider = signal<string>('');
  private _isSavingCloudZero = signal(false);
  private _isSavingManual = signal(false);
  private _isDeletingCloudZero = signal(false);
  private _isDeletingManual = signal(false);
  private _cloudZeroShowAction = signal(false);
  private _manualShowAction = signal(false);

  // ── Public readonly signals ──────────────────────────────────────────
  subscriptionState = this._subscriptionState.asReadonly();
  existingProvider = this._existingProvider.asReadonly();
  isSavingCloudZero = this._isSavingCloudZero.asReadonly();
  isSavingManual = this._isSavingManual.asReadonly();
  isDeletingCloudZero = this._isDeletingCloudZero.asReadonly();
  isDeletingManual = this._isDeletingManual.asReadonly();
  cloudZeroShowAction = this._cloudZeroShowAction.asReadonly();
  manualShowAction = this._manualShowAction.asReadonly();

  // ── Forms ────────────────────────────────────────────────────────────
  cloudZeroForm = new FormGroup({
    nuclia_tokens_price: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    billing_formula_id: new FormControl<string>('00000000-0000-4000-8000-000000000002', { nonNullable: true }),
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
    billing_formula_id: new FormControl<string>('00000000-0000-4000-8000-000000000001', { nonNullable: true }),
    free_tokens_per_billing_cycle: new FormControl<number | null>(null),
    free_storage_nuclia_tokens: new FormControl<number | null>(null),
    on_demand_budget: new FormControl<number | null>(null),
    action_on_budget_exhausted: new FormControl<ActionOnBudgetExhausted | null>(null),
  });

  // ── Static config ────────────────────────────────────────────────────
  actionOnBudgetOptions: { value: ActionOnBudgetExhausted; label: string }[] = [
    { value: 'WARN_ACCOUNT_OWNER', label: 'Warn account owner' },
    { value: 'BLOCK_ACCOUNT', label: 'Block account' },
  ];

  // ── Formula options (observable) ─────────────────────────────────────
  formulasOptions = this.globalService.getBillingFormulas().pipe(
    map((formulas) =>
      formulas.map(
        (formula) =>
          new OptionModel({ id: formula.id, value: formula.id, label: formula.title, help: formula.description }),
      ),
    ),
    shareReplay(1),
  );

  constructor() {
    this.setupBudgetCoupling(this.cloudZeroForm, true);
    this.setupBudgetCoupling(this.manualForm, false);
    this.loadSubscription();
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private setupBudgetCoupling(form: FormGroup, isCloudZero: boolean): void {
    const budgetCtrl = form.controls['on_demand_budget'];
    const actionCtrl = form.controls['action_on_budget_exhausted'];
    const hasBudget = (val: number | string | null | undefined) =>
      val !== null && val !== undefined && val !== '' && Number(val) > 0;

    if (isCloudZero) {
      this._cloudZeroShowAction.set(hasBudget(budgetCtrl.value));
    } else {
      this._manualShowAction.set(hasBudget(budgetCtrl.value));
    }

    budgetCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      const show = hasBudget(val);
      if (isCloudZero) {
        this._cloudZeroShowAction.set(show);
      } else {
        this._manualShowAction.set(show);
      }
      if (!show) {
        actionCtrl.setValue(null, { emitEvent: false });
      } else if (!actionCtrl.value) {
        actionCtrl.setValue('WARN_ACCOUNT_OWNER', { emitEvent: false });
      }
    });
  }

  private applyBudgetCouplingAfterPatch(form: FormGroup, isCloudZero: boolean): void {
    const budgetVal = form.controls['on_demand_budget'].value;
    const hasBudget = budgetVal !== null && budgetVal !== undefined && budgetVal !== '' && Number(budgetVal) > 0;
    if (isCloudZero) {
      this._cloudZeroShowAction.set(hasBudget);
    } else {
      this._manualShowAction.set(hasBudget);
    }
  }

  private populateForm(form: FormGroup, data: ManagerSubscriptionDetails, isCloudZero: boolean): void {
    form.patchValue({ ...data });
    this.applyBudgetCouplingAfterPatch(form, isCloudZero);
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

  private nullOrNumber(val: number | string | null | undefined): number | null {
    if (val === null || val === undefined || val === '') return null;
    return Number(val);
  }

  private buildBasePayload(raw: {
    nuclia_tokens_price: number | null;
    billing_formula_id: string;
    free_tokens_per_billing_cycle: number | null;
    free_storage_nuclia_tokens: number | null;
    on_demand_budget: number | null;
    action_on_budget_exhausted: ActionOnBudgetExhausted | null;
  }): BaseSubscriptionPayload {
    const freeTokens = this.nullOrNumber(raw.free_tokens_per_billing_cycle);
    const freeStorage = this.nullOrNumber(raw.free_storage_nuclia_tokens);
    const budget = this.nullOrNumber(raw.on_demand_budget);
    return {
      nuclia_tokens_price: raw.nuclia_tokens_price ?? 0,
      ...(raw.billing_formula_id ? { billing_formula_id: raw.billing_formula_id } : {}),
      ...(freeTokens !== null ? { free_tokens_per_billing_cycle: freeTokens } : {}),
      ...(freeStorage !== null ? { free_storage_nuclia_tokens: freeStorage } : {}),
      ...(budget !== null ? { on_demand_budget: budget } : {}),
      ...(raw.action_on_budget_exhausted != null ? { action_on_budget_exhausted: raw.action_on_budget_exhausted } : {}),
    };
  }

  private buildCloudZeroPayload(): CloudZeroSubscriptionPayload {
    const raw = this.cloudZeroForm.getRawValue();
    return {
      ...this.buildBasePayload(raw),
      product: raw.product,
      product_line: raw.product_line,
      business_unit: raw.business_unit,
    };
  }

  private buildManualPayload(): ManualSubscriptionPayload {
    return this.buildBasePayload(this.manualForm.getRawValue());
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
        this.toast.success(messages.success);
        onSuccess?.();
      },
      error: (err) => {
        setLoading(false);
        const is409 = err?.status === 409;
        this.toast.error(is409 && messages.conflict ? messages.conflict : err?.body?.detail || messages.error);
      },
    });
  }

  // ── Public action methods ────────────────────────────────────────────

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
}
