import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountTypeDefaults, type SubscriptionProvider } from '@flaps/core';
import { AccountTypes, WorkflowType } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { filter, forkJoin, map, of, Subject, switchMap, tap } from 'rxjs';
import { catchError, take, takeUntil } from 'rxjs/operators';
import { ManagerStore } from '../../../manager.store';
import { AccountConfigurationPayload, AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { ZONE_VISIBILITY_OPTIONS, ZoneVisibility } from '../../../manage-zones/zone.models';
import { GlobalAccountService } from '../../global-account.service';
import { AccountBudget, ActionOnBudgetExhausted } from '../../global-account.models';

@Component({
  templateUrl: './configuration.component.html',
  styleUrls: ['configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private accountBackup?: AccountDetails;

  canFullyEditAccount = this.store.canFullyEditAccount;
  canEdit = this.store.canEdit;
  readonly zoneVisibilityOptions = ZONE_VISIBILITY_OPTIONS;
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
    trialExpirationDate: new FormControl<string>(''),
    workflow: new FormControl<WorkflowType>('classic'),
    allowAccessNonEnterpriseModels: new FormControl<boolean>(false, { nonNullable: true }),
    zoneVisibility: new FormControl<ZoneVisibility>('DEFAULT', { nonNullable: true }),
    labels: new FormGroup({
      progress_account: new FormControl<boolean>(false, { nonNullable: true }),
    }),
  });
  free_tokens_per_billing_cycle = 0;
  provider?: SubscriptionProvider;
  isSaving = false;

  defaultLimits?: AccountTypeDefaults;
  isTrial = false;

  private budgetBackup: AccountBudget | null = null;
  budgetForm = new FormGroup({
    custom_budget: new FormControl<'default' | 'unlimited' | 'limit'>('default', { nonNullable: true }),
    budget_value: new FormControl<number | null>(null, { validators: [Validators.min(1)] }),
    action_on_budget_exhausted: new FormControl<ActionOnBudgetExhausted>('BLOCK_ACCOUNT', { nonNullable: true }),
  });

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
    private globalAccountService: GlobalAccountService,
    private toast: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.store.accountDetails
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
              tap((defaultLimits) => {
                this.defaultLimits = defaultLimits;
                this.cdr.markForCheck();
              }),
              take(1),
            ),
            this.accountService.getSubscription(accountDetails.id).pipe(
              catchError(() => of(null)),
              tap((sub) => {
                if (sub) {
                  this.provider = sub.provider;
                  this.free_tokens_per_billing_cycle = sub.subscription.free_tokens_per_billing_cycle || 0;
                  this.cdr.markForCheck();
                }
              }),
              take(1),
            ),
            this.globalAccountService.getBudget(accountDetails.id).pipe(
              catchError(() => of(null)),
              tap((budget) => {
                this.budgetBackup = budget;
                this.patchBudget(budget);
                this.cdr.markForCheck();
              }),
              take(1),
            ),
          ]),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    const accountBackup = this.accountBackup;
    if (this.configForm.valid && this.budgetForm.valid && accountBackup) {
      this.isSaving = true;
      const controls = this.configForm.controls;
      const rawValue = this.configForm.getRawValue();
      this.canFullyEditAccount
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
              payload.trialExpirationDate = rawValue.trialExpirationDate ?? null;
            }
            if (controls.allowAccessNonEnterpriseModels.dirty) {
              payload.allowAccessNonEnterpriseModels = rawValue.allowAccessNonEnterpriseModels;
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
            this.isSaving = false;
            this.accountBackup = { ...updatedAccount };
            this.budgetBackup = budget;
            this.configForm.markAsPristine();
            this.budgetForm.markAsPristine();
            this.cdr.markForCheck();
          },
          error: () => {
            this.isSaving = false;
            this.cdr.markForCheck();
            this.toast.error('Updating account failed');
          },
        });
    }
  }

  saveBudget() {
    if (!this.accountBackup) {
      return of(null);
    }
    const { custom_budget, ...budget } = this.budgetForm.getRawValue();
    let budgetPayload: AccountBudget | null;
    if (custom_budget === 'limit') {
      budgetPayload = budget;
    } else if (custom_budget === 'unlimited') {
      budgetPayload = { budget_value: null, action_on_budget_exhausted: null };
    } else {
      budgetPayload = null;
    }
    if (budgetPayload) {
      return this.budgetBackup
        ? this.globalAccountService.patchBudget(this.accountBackup.id, budgetPayload)
        : this.globalAccountService.addBudget(this.accountBackup.id, budgetPayload);
    } else {
      return this.budgetBackup !== null
        ? this.globalAccountService.deleteBudget(this.accountBackup.id).pipe(map(() => null))
        : of(null);
    }
  }

  reset() {
    if (this.accountBackup) {
      this.patchConfigForm(this.accountBackup);
      this.configForm.markAsPristine();
      this.cdr.markForCheck();
    }
    this.resetBudget();
  }

  resetBudget() {
    this.patchBudget(this.budgetBackup || null);
  }

  resetMaxKbsToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.kbs.controls.maxKbs.patchValue(this.defaultLimits.max_kbs);
    this.configForm.controls.kbs.markAsDirty();
    this.cdr.markForCheck();
  }
  resetMaxAragsToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.agents.controls.maxAgents.patchValue(this.defaultLimits.max_agents);
    this.configForm.controls.agents.markAsDirty();
    this.cdr.markForCheck();
  }
  resetMaxAragsWithMemoryToDefault() {
    if (!this.defaultLimits) {
      return;
    }
    this.configForm.controls.memories.controls.maxMemories.patchValue(this.defaultLimits.max_memories);
    this.configForm.controls.memories.markAsDirty();
    this.cdr.markForCheck();
  }

  private patchConfigForm(accountDetails: AccountDetails) {
    const { labels, ...details } = accountDetails;
    this.configForm.patchValue(details);
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

  private patchBudget(budget: AccountBudget | null) {
    if (budget) {
      this.budgetForm.patchValue({
        budget_value: budget.budget_value,
        action_on_budget_exhausted: budget.action_on_budget_exhausted || 'BLOCK_ACCOUNT',
        custom_budget: budget.budget_value === null ? 'unlimited' : 'limit',
      });
    } else {
      this.budgetForm.reset();
    }
    // A timeout is needed to correctly set pastanaga radios as pristine
    setTimeout(() => {
      this.budgetForm.markAsPristine();
      this.cdr.markForCheck();
    });
  }

  updateFreeTokens() {
    if (this.accountBackup?.id && this.provider) {
      this.accountService
        .setFreeTokens(this.accountBackup.id, this.provider, this.free_tokens_per_billing_cycle)
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
