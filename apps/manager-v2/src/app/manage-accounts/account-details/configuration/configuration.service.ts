import { ChangeDetectorRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountTypeDefaults, type SubscriptionProvider } from '@flaps/core';
import { AccountTypes, WorkflowType } from '@nuclia/core';
import { toast } from '@spartan-ng/brain/sonner';
import { defer, filter, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { ZoneVisibility } from '../../../manage-zones/zone.models';
import { ManagerStore } from '../../../manager.store';
import { AccountConfigurationPayload, AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { AccountBudget, ActionOnBudgetExhausted } from '../../global-account.models';
import { GlobalAccountService } from '../../global-account.service';
import { toLimitMode } from '../account-details.utils';
import { isBudgetChanged, toBudgetPayload, toMaxValue } from './configuration.utils';

@Injectable()
export class ConfigurationService {
  private store = inject(ManagerStore);
  private accountService = inject(AccountService);
  private globalAccountService = inject(GlobalAccountService);
  // provided at component level, so this is the change detector of the configuration component
  private cdr = inject(ChangeDetectorRef);
  private accountDetails$ = toObservable(this.store.accountDetails);
  private accountBackup?: AccountDetails;
  private budgetBackup: AccountBudget | null = null;
  private defaultLimits?: AccountTypeDefaults;

  canFullyEditAccount = this.store.canFullyEditAccount;
  free_tokens_per_billing_cycle = signal(0);
  provider = signal<SubscriptionProvider | undefined>(undefined);
  isSaving = signal(false);

  configForm = new FormGroup({
    slug: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    created: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<AccountTypes>('stash-trial', { nonNullable: true, validators: [Validators.required] }),
    kbs: new FormGroup({
      kbs_radio: new FormControl<'limit' | 'unlimited'>('limit', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      maxKbs: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    }),
    agents: new FormGroup({
      agents_radio: new FormControl<'limit' | 'unlimited'>('limit', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      maxAgents: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    }),
    memories: new FormGroup({
      memories_radio: new FormControl<'limit' | 'unlimited'>('limit', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      maxMemories: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required] }),
    }),
    zone: new FormControl<string>(''),
    trialExpirationDate: new FormControl<Date | null>(null),
    workflow: new FormControl<WorkflowType>('classic'),
    allowAccessNonEnterpriseModels: new FormControl<boolean>(false, { nonNullable: true }),
    allowAccessExternalModels: new FormControl<boolean>(true, { nonNullable: true }),
    zoneVisibility: new FormControl<ZoneVisibility>('DEFAULT', { nonNullable: true }),
    labels: new FormGroup({
      progress_account: new FormControl<boolean>(false, { nonNullable: true }),
    }),
  });

  budgetForm = new FormGroup({
    custom_budget: new FormControl<'unlimited' | 'limit'>('limit', { nonNullable: true }),
    budget_value: new FormControl<number | null>(1, { validators: [Validators.min(1)] }),
    action_on_budget_exhausted: new FormControl<ActionOnBudgetExhausted>('BLOCK_ACCOUNT', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const canEdit = this.store.canEdit();
      untracked(() => {
        const editableControls = [
          this.configForm.controls.type,
          this.configForm.controls.workflow,
          this.configForm.controls.trialExpirationDate,
        ];
        editableControls.forEach((control) => (canEdit ? control.enable() : control.disable()));
      });
    });

    this.accountDetails$
      .pipe(
        filter((details) => !!details),
        map((accountDetails) => accountDetails as AccountDetails),
        tap((accountDetails) => {
          this.accountBackup = { ...accountDetails };
          this.patchConfigForm(accountDetails);
        }),
        switchMap((accountDetails) =>
          forkJoin([
            this.accountService.getDefaultLimits(accountDetails.type).pipe(
              tap((defaultLimits) => (this.defaultLimits = defaultLimits)),
              take(1),
            ),
            this.accountService.getSubscription(accountDetails.id).pipe(
              catchError(() => of(null)),
              tap((sub) => {
                if (sub) {
                  this.provider.set(sub.provider);
                  this.free_tokens_per_billing_cycle.set(sub.subscription.free_tokens_per_billing_cycle || 0);
                }
              }),
              take(1),
            ),
            of(this.canFullyEditAccount()).pipe(
              take(1),
              switchMap((canFullyEditAccount) => {
                if (canFullyEditAccount) {
                  return this.globalAccountService.getBudget(accountDetails.id).pipe(
                    catchError(() => {
                      toast.error('An error occurred when loading the budget');
                      return of(null);
                    }),
                    tap((budget) => {
                      if (budget) {
                        this.budgetBackup = budget;
                        this.patchBudget(budget);
                        this.cdr.markForCheck();
                      }
                    }),
                    take(1),
                  );
                } else {
                  return of(null);
                }
              }),
            ),
          ]),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  save() {
    const accountBackup = this.accountBackup;
    if (this.configForm.valid && this.budgetForm.valid && accountBackup) {
      this.isSaving.set(true);
      const controls = this.configForm.controls;
      const rawValue = this.configForm.getRawValue();
      of(this.canFullyEditAccount())
        .pipe(
          take(1),
          switchMap((canFullyEditAccount) => {
            const payload: Partial<AccountConfigurationPayload> = {};
            if (controls.email.dirty) {
              payload.email = rawValue.email;
            }
            if (controls.slug.dirty) {
              payload.slug = rawValue.slug;
            }
            if (controls.type.dirty) {
              payload.type = rawValue.type;
            }
            if (controls.workflow.dirty) {
              payload.workflow = rawValue.workflow;
            }
            if (controls.zoneVisibility.dirty) {
              payload.zoneVisibility = rawValue.zoneVisibility;
            }
            if (controls.trialExpirationDate.dirty) {
              payload.trialExpirationDate = rawValue.trialExpirationDate?.toISOString() ?? null;
            }
            if (controls.allowAccessNonEnterpriseModels.dirty) {
              payload.allowAccessNonEnterpriseModels = rawValue.allowAccessNonEnterpriseModels;
            }
            if (controls.allowAccessExternalModels.dirty) {
              payload.allowAccessExternalModels = rawValue.allowAccessExternalModels;
            }
            if (controls.labels.dirty) {
              payload.labels = rawValue.labels;
            }
            if (canFullyEditAccount) {
              if (controls.kbs.dirty) {
                payload.maxKbs = toMaxValue(rawValue.kbs.kbs_radio, rawValue.kbs.maxKbs);
              }
              if (controls.agents.dirty) {
                payload.maxAgents = toMaxValue(rawValue.agents.agents_radio, rawValue.agents.maxAgents);
              }
              if (controls.memories.dirty) {
                payload.maxMemories = toMaxValue(rawValue.memories.memories_radio, rawValue.memories.maxMemories);
              }
            }
            const saveBudgetRequest = canFullyEditAccount ? this.saveBudget() : of(null);
            return forkJoin([this.accountService.updateAccount(accountBackup.id, payload), saveBudgetRequest]);
          }),
        )
        .subscribe({
          next: ([updatedAccount, budget]) => {
            this.isSaving.set(false);
            this.accountBackup = { ...updatedAccount };
            this.budgetBackup = budget;
            this.configForm.markAsPristine();
            this.budgetForm.markAsPristine();
          },
          error: () => {
            this.isSaving.set(false);
            toast.error('Updating account failed');
          },
        });
    }
  }

  reset() {
    if (this.accountBackup) {
      this.patchConfigForm(this.accountBackup);
      this.configForm.markAsPristine();
    }
    this.resetBudget();
  }

  resetBudget() {
    if (this.budgetBackup) {
      this.patchBudget(this.budgetBackup);
    }
  }

  resetMaxKbsToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.kbs.controls.maxKbs.patchValue(this.defaultLimits.max_kbs);
    this.configForm.controls.kbs.markAsDirty();
  }

  resetMaxAragsToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.agents.controls.maxAgents.patchValue(this.defaultLimits.max_agents);
    this.configForm.controls.agents.markAsDirty();
  }

  resetMaxAragsWithMemoryToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.memories.controls.maxMemories.patchValue(this.defaultLimits.max_memories);
    this.configForm.controls.memories.markAsDirty();
  }

  onFreeTokensInput(event: Event) {
    this.free_tokens_per_billing_cycle.set(Number((event.target as HTMLInputElement).value));
  }

  updateFreeTokens() {
    const provider = this.provider();
    if (this.accountBackup?.id && provider) {
      const accountId = this.accountBackup.id;
      defer(() =>
        this.accountService.setFreeTokens(accountId, provider, this.free_tokens_per_billing_cycle()),
      ).subscribe({
        next: () => toast.success('Free tokens updated successfully'),
        error: () => toast.error('Failed to update free tokens'),
      });
    }
  }

  private saveBudget(): Observable<AccountBudget | null> {
    if (!this.accountBackup) {
      return of(null);
    }
    const accountId = this.accountBackup.id;
    const budgetPayload = toBudgetPayload(this.budgetForm.getRawValue());

    if (isBudgetChanged(this.budgetBackup, budgetPayload)) {
      return this.globalAccountService.patchBudget(accountId, budgetPayload).pipe(
        catchError((error) => {
          // If the budget has not been set yet, POST endpoint must be used instead
          return error?.status === 404
            ? this.globalAccountService.addBudget(accountId, budgetPayload)
            : throwError(() => error);
        }),
      );
    } else {
      return of(null);
    }
  }

  private patchConfigForm(accountDetails: AccountDetails) {
    const { labels, trialExpirationDate, ...details } = accountDetails;
    this.configForm.patchValue({
      ...details,
      trialExpirationDate: trialExpirationDate ? new Date(trialExpirationDate) : null,
    });
    this.configForm.controls.kbs.controls.kbs_radio.patchValue(toLimitMode(accountDetails.maxKbs));
    this.configForm.controls.kbs.controls.maxKbs.patchValue(accountDetails.maxKbs);
    this.configForm.controls.agents.controls.agents_radio.patchValue(toLimitMode(accountDetails.maxAgents));
    this.configForm.controls.agents.controls.maxAgents.patchValue(accountDetails.maxAgents);
    this.configForm.controls.memories.controls.memories_radio.patchValue(toLimitMode(accountDetails.maxMemories));
    this.configForm.controls.memories.controls.maxMemories.patchValue(accountDetails.maxMemories);
    if (labels !== null) {
      this.configForm.controls.labels.patchValue(labels);
    }
    this.cdr.markForCheck();
  }

  private patchBudget(budget: AccountBudget) {
    this.budgetForm.patchValue({
      budget_value: budget.budget_value,
      action_on_budget_exhausted: budget.action_on_budget_exhausted || 'BLOCK_ACCOUNT',
      custom_budget: budget.budget_value === null ? 'unlimited' : 'limit',
    });
    this.budgetForm.markAsPristine();
  }
}
