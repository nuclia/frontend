import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { catchError, concatMap, map, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { BillingService, NavigationService, SDKService, STFUtils, SubscriptionStatus } from '@flaps/core';
import { Account, SamlConfig } from '@nuclia/core';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { AccountDeleteComponent } from './account-delete/account-delete.component';
import { Sluggable } from '@flaps/common';

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
    slug: ['', [Sluggable()]],
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

  cannotDeleteAccount = this.billingService.getSubscription().pipe(
    map((subscription) => {
      const hasSubscription =
        subscription &&
        'status' in subscription.subscription &&
        ![SubscriptionStatus.NO_SUBSCRIPTION || SubscriptionStatus.CANCELED].includes(subscription.subscription.status);
      return !!(subscription?.provider === 'MANUAL' || hasSubscription);
    }),
    shareReplay(1),
  );
  isSubscribedToStripe = this.billingService.isSubscribedToStripe;
  isSubscribedToAws = this.billingService.isSubscribedToAws;
  awsSubscriptionUrl = this.sdk.currentAccount.pipe(map((account) => this.navigation.getBillingUrl(account.slug)));
  stripeSubscriptionUrl = this.sdk.currentAccount.pipe(
    map((account) => `${this.navigation.getBillingUrl(account.slug)}/my-subscription`),
  );

  constructor(
    private formBuilder: UntypedFormBuilder,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private modalService: SisModalService,
    private billingService: BillingService,
    private toaster: SisToastService,
    private router: Router,
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
    const oldSlug = this.account?.slug || '';
    const newSlug = STFUtils.generateSlug(this.accountForm.value.slug);
    const isSlugUpdated = oldSlug !== newSlug;
    this.sdk.nuclia.db
      .modifyAccount(this.account!.slug, {
        title: this.accountForm.value.title,
        description: this.accountForm.value.description,
        slug: isSlugUpdated ? newSlug : undefined,
      })
      .pipe(
        catchError((error) => {
          if (error.status === 409) {
            this.toaster.error('account.slug-unavailable');
          }
          throw error;
        }),
        concatMap(() => this.sdk.nuclia.db.getAccount(newSlug)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((account) => {
        this.sdk.account = account;
        if (isSlugUpdated) {
          this.router.navigateByUrl(this.router.url.replace(oldSlug, newSlug));
        }
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
