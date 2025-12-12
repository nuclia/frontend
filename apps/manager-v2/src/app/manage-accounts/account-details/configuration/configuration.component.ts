import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AccountTypeDefaults, type SubscriptionProvider } from '@flaps/core';
import { AccountTypes } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { filter, forkJoin, map, of, Subject, switchMap, tap } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ManagerStore } from '../../../manager.store';
import { AccountConfigurationPayload, AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';

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
  });
  free_tokens_per_billing_cycle = 0;
  provider?: SubscriptionProvider;
  isSaving = false;

  defaultLimits?: AccountTypeDefaults;
  isTrial = false;

  constructor(
    private store: ManagerStore,
    private accountService: AccountService,
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
              tap((sub) => {
                this.provider = sub.provider;
                this.free_tokens_per_billing_cycle = sub.subscription.free_tokens_per_billing_cycle || 0;
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
    if (this.configForm.valid && accountBackup) {
      this.isSaving = true;
      const { trialExpirationDate, kbs, agents, memories, ...rawValue } = this.configForm.getRawValue();
      this.canFullyEditAccount
        .pipe(
          take(1),
          switchMap((canFullyEditAccount) => {
            const payload: Partial<AccountConfigurationPayload> = canFullyEditAccount
              ? {
                  ...rawValue,
                  maxKbs: kbs.kbs_radio === 'limit' ? kbs.maxKbs : -1,
                  maxAgents: agents.agents_radio === 'limit' ? agents.maxAgents : -1,
                  maxMemories: memories.memories_radio === 'limit' ? memories.maxMemories : -1,
                }
              : {
                  trialExpirationDate,
                  type: rawValue.type,
                };
            payload.trialExpirationDate = trialExpirationDate ? trialExpirationDate : null;
            return this.accountService.updateAccount(accountBackup.id, payload);
          }),
        )
        .subscribe({
          next: (updatedAccount) => {
            this.isSaving = false;
            this.accountBackup = { ...updatedAccount };
            this.configForm.markAsPristine();
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

  reset() {
    if (this.accountBackup) {
      this.patchConfigForm(this.accountBackup);
      this.configForm.markAsPristine();
      this.cdr.markForCheck();
    }
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

  toggleAccountType(type: AccountTypes) {
    this.configForm.controls.type.patchValue(type);
    this.configForm.controls.type.markAsDirty();
    this.cdr.markForCheck();
  }

  private patchConfigForm(accountDetails: AccountDetails) {
    this.configForm.patchValue(accountDetails);
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
    this.cdr.markForCheck();
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
