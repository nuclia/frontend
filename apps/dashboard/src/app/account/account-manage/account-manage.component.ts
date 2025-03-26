import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { concatMap, map, takeUntil, tap } from 'rxjs/operators';
import { BillingService, NavigationService, SDKService, SubscriptionStatus } from '@flaps/core';
import { Account, SamlConfig } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';
import { AccountDeleteComponent } from './account-delete/account-delete.component';

@Component({
  selector: 'app-account-manage',
  templateUrl: './account-manage.component.html',
  styleUrls: ['./account-manage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountManageComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  account: Account | undefined;

  accountForm = this.formBuilder.group({
    id: [''],
    slug: [''],
    title: ['', [Validators.required]],
    description: [''],
  });
  samlForm = this.formBuilder.group({
    domains: ['', [Validators.required]],
    entity_id: ['', [Validators.required]],
    sso_url: ['', [Validators.required]],
    x509_cert: ['', [Validators.required]],
    authn_context: [''],
  });

  validationMessages = {
    title: {
      required: 'account.account_name_invalid',
    } as IErrorMessages,
  };

  cannotDeleteAccount = this.billingService
    .getStripeSubscription()
    .pipe(
      map(
        (subscription) =>
          subscription?.status === SubscriptionStatus.ACTIVE ||
          subscription?.status === SubscriptionStatus.PENDING ||
          subscription?.status === SubscriptionStatus.PAYMENT_ISSUES,
      ),
    );
  cancelSubscriptionUrl = this.sdk.currentAccount.pipe(
    map((account) => `${this.navigation.getBillingUrl(account.slug)}/my-subscription`),
  );

  constructor(
    private formBuilder: UntypedFormBuilder,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private modalService: SisModalService,
    private billingService: BillingService,
  ) {}

  ngOnInit(): void {
    this.sdk.currentAccount
      .pipe(
        tap((account) => {
          this.account = account;
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.initAccountForm();
        this.initSamlForm();
        this.cdr?.markForCheck();
      });
  }

  initAccountForm(): void {
    this.accountForm.reset(this.account);
  }

  initSamlForm() {
    if (this.account && this.account.saml_config) {
      const config = this.account.saml_config;
      this.samlForm.reset({ ...config, domains: config.domains.join(', ') });
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }

  saveAccount() {
    if (this.accountForm.invalid) return;
    this.sdk.nuclia.db
      .modifyAccount(this.account!.slug, {
        title: this.accountForm.value.title,
        description: this.accountForm.value.description,
      })
      .pipe(
        concatMap(() => this.sdk.nuclia.db.getAccount(this.account!.slug)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((account) => {
        this.sdk.account = account;
        this.initAccountForm();
      });
  }

  saveSaml() {
    if (this.samlForm.invalid || !this.account) return;
    this._saveSaml(this.account.slug, {
      domains: this.samlForm.value.domains.split(',').map((domain: string) => domain.trim()),
      entity_id: this.samlForm.value.entity_id,
      sso_url: this.samlForm.value.sso_url,
      x509_cert: this.samlForm.value.x509_cert,
      authn_context: this.samlForm.value.authn_context || undefined,
    });
  }

  removeSaml() {
    if (!this.account) return;
    this._saveSaml(this.account.slug, null);
  }

  private _saveSaml(slug: string, saml_config: SamlConfig | undefined | null) {
    this.sdk.nuclia.db
      .modifyAccount(slug, {
        saml_config,
      })
      .pipe(concatMap(() => this.sdk.nuclia.db.getAccount(slug)))
      .subscribe((account) => {
        this.sdk.account = account;
        this.initSamlForm();
      });
  }

  deleteAccount() {
    this.modalService.openModal(AccountDeleteComponent);
  }
}
