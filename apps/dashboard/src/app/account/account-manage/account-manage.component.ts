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
import { UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject, take } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AccountModification, SDKService, StateService, STFTrackingService, Zone, ZoneService } from '@flaps/core';
import { Account } from '@nuclia/core';
import { TOPBAR_HEIGHT } from '../../styles/js-variables';
import { NavigationService, Sluggable } from '@flaps/common';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';
import { AccountDeleteComponent } from './account-delete/account-delete.component';
import { SubscribedAccountDeleteComponent } from './account-delete/subscribed-account-delete.component';
import { BillingService } from '../billing/billing.service';

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

  isUsersEnabled = this.tracking.isFeatureEnabled('manage-users');

  zones: Zone[] | undefined;
  zone = new UntypedFormControl();
  speechToText: boolean = false;
  initialValues = { title: '', description: '', slug: '', uid: '' };

  constructor(
    private stateService: StateService,
    private formBuilder: UntypedFormBuilder,
    private zoneService: ZoneService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private tracking: STFTrackingService,
    private router: Router,
    private navigation: NavigationService,
    private modalService: SisModalService,
    private billingService: BillingService,
  ) {}

  ngOnInit(): void {
    this.stateService.account
      .pipe(
        filter((account): account is Account => !!account),
        tap((account) => {
          this.account = account;
          this.initialValues.title = account.title;
          this.initialValues.description = account.description || '';
          this.initialValues.uid = account.id;
          this.initialValues.slug = account.slug;
        }),
        switchMap(() => this.initZones()),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.speechToText = !!this.account!.config?.g_speech_to_text;
        this.initAccountForm();
        this.cdr?.markForCheck();
      });

    this.zone.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.unsubscribeAll))
      .subscribe((zone) => this.saveZone(zone));
  }

  initAccountForm(): void {
    this.accountForm.reset(this.initialValues);
  }

  initZones(): Observable<void> {
    return this.zoneService.getZones().pipe(
      map((zones) => {
        this.zones = zones;
        this.zone.patchValue(this.account!.zone, { emitEvent: false });
      }),
    );
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
        this.stateService.setAccount(account);
      });
  }

  saveZone(value: string) {
    //TODO: missing field "zone" in AccountModification
  }

  deleteAccount() {
    this.billingService.isSubscribed
      .pipe(
        take(1),
        switchMap((subscribed) =>
          subscribed
            ? this.modalService.openModal(SubscribedAccountDeleteComponent).onClose
            : this.modalService.openModal(AccountDeleteComponent).onClose,
        ),
      )
      .subscribe();
  }
}
