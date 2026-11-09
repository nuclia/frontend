import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountTypeDefaults, type SubscriptionProvider } from '@flaps/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matRefreshRound } from '@ng-icons/material-icons/round';
import { AccountTypes, WorkflowType } from '@nuclia/core';
import { UiToastService } from '@nuclia/ui/toast';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDatePickerImports } from '@nuclia/ui-spartan/date-picker';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmLabelImports } from '@nuclia/ui-spartan/label';
import { HlmRadioGroupImports } from '@nuclia/ui-spartan/radio-group';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { HlmSwitchImports } from '@nuclia/ui-spartan/switch';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';
import { filter, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { ZONE_VISIBILITY_OPTIONS, ZoneVisibility } from '../../../manage-zones/zone.models';
import { ManagerStore } from '../../../manager.store';
import { AccountConfigurationPayload, AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { AccountBudget, ActionOnBudgetExhausted } from '../../global-account.models';
import { GlobalAccountService } from '../../global-account.service';
import { BlockedFeaturesComponent } from '../blocked-features/blocked-features.component';

@Component({
  templateUrl: './configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmDatePickerImports,
    HlmFieldImports,
    HlmInputImports,
    HlmLabelImports,
    HlmRadioGroupImports,
    HlmSelectImports,
    HlmSwitchImports,
    HlmTooltipImports,
    NgIcon,
    FormFooterComponent,
    BlockedFeaturesComponent,
  ],
  providers: [provideIcons({ matRefreshRound })],
})
export class ConfigurationComponent {
  private store = inject(ManagerStore);
  private accountService = inject(AccountService);
  private globalAccountService = inject(GlobalAccountService);
  private toast = inject(UiToastService);
  private cdr = inject(ChangeDetectorRef);
  private accountBackup?: AccountDetails;

  canFullyEditAccount = this.store.canFullyEditAccount;
  canEdit = this.store.canEdit;
  private accountDetails$ = toObservable(this.store.accountDetails);
  readonly zoneVisibilityOptions = ZONE_VISIBILITY_OPTIONS;
  readonly accountTypeOptions: { value: AccountTypes; label: string }[] = [
    { value: 'stash-trial', label: 'Trial' },
    { value: 'cowork', label: 'Cowork' },
    { value: 'v3starter', label: 'Starter v3' },
    { value: 'v3fly', label: 'Fly v3' },
    { value: 'v3growth', label: 'Growth v3' },
    { value: 'v3pro', label: 'Pro v3' },
    { value: 'v3enterprise', label: 'Enterprise v3' },
  ];
  readonly workflowOptions: { value: WorkflowType; label: string }[] = [
    { value: 'classic', label: 'Classic' },
    { value: 'cowork', label: 'Cowork' },
  ];
  readonly accountTypeLabel = (value: AccountTypes) =>
    this.accountTypeOptions.find((option) => option.value === value)?.label ?? value;
  readonly workflowLabel = (value: WorkflowType) =>
    this.workflowOptions.find((option) => option.value === value)?.label ?? value;
  readonly zoneVisibilityLabel = (value: ZoneVisibility) =>
    this.zoneVisibilityOptions.find((option) => option.value === value)?.label ?? value;
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
  free_tokens_per_billing_cycle = signal(0);
  provider = signal<SubscriptionProvider | undefined>(undefined);
  isSaving = signal(false);

  defaultLimits?: AccountTypeDefaults;
  isTrial = false;

  private budgetBackup: AccountBudget | null = null;
  budgetForm = new FormGroup({
    custom_budget: new FormControl<'unlimited' | 'limit'>('limit', { nonNullable: true }),
    budget_value: new FormControl<number | null>(1, { validators: [Validators.min(1)] }),
    action_on_budget_exhausted: new FormControl<ActionOnBudgetExhausted>('BLOCK_ACCOUNT', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const canEdit = this.canEdit();
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
          this.isTrial = !!accountDetails.trialExpirationDate;
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
                      this.toast.error('An error occurred when loading the budget');
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
                payload.maxKbs = rawValue.kbs.kbs_radio === 'limit' ? rawValue.kbs.maxKbs : -1;
              }
              if (controls.agents.dirty) {
                payload.maxAgents = rawValue.agents.agents_radio === 'limit' ? rawValue.agents.maxAgents : -1;
              }
              if (controls.memories.dirty) {
                payload.maxMemories = rawValue.memories.memories_radio === 'limit' ? rawValue.memories.maxMemories : -1;
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
            this.toast.error('Updating account failed');
          },
        });
    }
  }

  saveBudget(): Observable<AccountBudget | null> {
    if (!this.accountBackup) {
      return of(null);
    }
    const accountId = this.accountBackup.id;
    const { custom_budget, ...budget } = this.budgetForm.getRawValue();
    let budgetPayload: AccountBudget;
    if (custom_budget === 'limit') {
      budgetPayload = budget;
    } else {
      budgetPayload = { budget_value: null, action_on_budget_exhausted: null };
    }
    const changed =
      this.budgetBackup?.budget_value !== budgetPayload.budget_value ||
      this.budgetBackup?.action_on_budget_exhausted !== budgetPayload.action_on_budget_exhausted;

    if (changed) {
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

  private patchConfigForm(accountDetails: AccountDetails) {
    const { labels, trialExpirationDate, ...details } = accountDetails;
    this.configForm.patchValue({
      ...details,
      trialExpirationDate: trialExpirationDate ? new Date(trialExpirationDate) : null,
    });
    this.configForm.controls.kbs.controls.kbs_radio.patchValue(accountDetails.maxKbs === -1 ? 'unlimited' : 'limit');
    this.configForm.controls.kbs.controls.maxKbs.patchValue(accountDetails.maxKbs);
    this.configForm.controls.agents.controls.agents_radio.patchValue(
      accountDetails.maxAgents === -1 ? 'unlimited' : 'limit',
    );
    this.configForm.controls.agents.controls.maxAgents.patchValue(accountDetails.maxAgents);
    this.configForm.controls.memories.controls.memories_radio.patchValue(
      accountDetails.maxMemories === -1 ? 'unlimited' : 'limit',
    );
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

  onFreeTokensInput(event: Event) {
    this.free_tokens_per_billing_cycle.set(Number((event.target as HTMLInputElement).value));
  }

  updateFreeTokens() {
    const provider = this.provider();
    if (this.accountBackup?.id && provider) {
      this.accountService
        .setFreeTokens(this.accountBackup.id, provider, this.free_tokens_per_billing_cycle())
        .pipe(map(() => true))
        .subscribe((success) => {
          if (success) {
            this.toast.success('Free tokens updated successfully');
          } else {
            this.toast.error('Failed to update free tokens');
          }
        });
    }
  }
}
