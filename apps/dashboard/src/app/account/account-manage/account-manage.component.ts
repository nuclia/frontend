import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Subject } from 'rxjs';
import { concatMap, map, takeUntil, tap } from 'rxjs/operators';
import { AccountModification, BillingService, SDKService, SubscriptionStatus } from '@flaps/core';
import { Account } from '@nuclia/core';
import { TOPBAR_HEIGHT } from '../../styles/js-variables';
import { NavigationService, Sluggable } from '@flaps/common';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';
import { AccountDeleteComponent } from './account-delete/account-delete.component';

type Section = 'account' | 'config' | 'knowledgeboxes' | 'users' | 'nucliaDBs';

@Component({
  selector: 'app-account-manage',
  templateUrl: './account-manage.component.html',
  styleUrls: ['./account-manage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountManageComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  topbarHeight = parseInt(TOPBAR_HEIGHT, 10);
  account: Account | undefined;
  @ViewChildren('section') sections: QueryList<ElementRef> | undefined;

  accountForm = this.formBuilder.group({
    uid: [''],
    slug: [''],
    title: ['', [Sluggable()]],
    description: [''],
  });

  validationMessages = {
    title: {
      sluggable: 'account.account_name_invalid',
    } as IErrorMessages,
  };

  speechToText: boolean = false;
  initialValues = { title: '', description: '', slug: '', uid: '' };

  cannotDeleteAccount = this.billingService
    .getSubscription()
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
          this.initialValues.title = account.title;
          this.initialValues.description = account.description || '';
          this.initialValues.uid = account.id;
          this.initialValues.slug = account.slug;
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.speechToText = !!this.account!.config?.g_speech_to_text;
        this.initAccountForm();
        this.cdr?.markForCheck();
      });
  }

  initAccountForm(): void {
    this.accountForm.reset(this.initialValues);
  }

  ngOnDestroy(): void {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }

  saveAccount() {
    if (this.accountForm.invalid) return;
    const data: AccountModification = {
      title: this.accountForm.value.title,
      description: this.accountForm.value.description,
    };

    this.sdk.nuclia.db
      .modifyAccount(this.account!.slug, data)
      .pipe(
        concatMap(() => this.sdk.nuclia.db.getAccount(this.account!.slug)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((account) => {
        this.sdk.account = account;
      });
  }

  deleteAccount() {
    this.modalService.openModal(AccountDeleteComponent);
  }
}
