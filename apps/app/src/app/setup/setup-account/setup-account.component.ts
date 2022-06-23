import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormBuilder, Validators, AbstractControl } from '@angular/forms';
import { of, concatMap, map, filter, catchError } from 'rxjs';
import { ZoneService, Zone, STFUtils } from '@flaps/core';
import { Sluggable } from '@flaps/common';
import { NavigationService } from '../../services/navigation.service';
import { AppToasterService } from '../../services/app-toaster.service';
import { SDKService, UserService } from '@flaps/auth';
import { Account, KnowledgeBoxCreation } from '@nuclia/core';
import * as Sentry from '@sentry/angular';

const DEFAULT_KB_NAME = 'Basic';

@Component({
  selector: 'app-setup-account',
  templateUrl: './setup-account.component.html',
  styleUrls: ['./setup-account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupAccountComponent {
  user = this.userService.userPrefs.pipe(
    filter((prefs) => !!prefs),
    map((prefs) => prefs!.name),
  );
  accountForm = this.formBuilder.group({
    account: [
      '',
      {
        validators: [Sluggable()],
        asyncValidators: [this.availableAccountValidator.bind(this)],
        updateOn: 'blur',
      },
    ],
    kb: ['', [Sluggable()]],
    zone: ['', [Validators.required]],
  });

  validationMessages = {
    account: {
      sluggable: 'account.account_name_invalid',
      available: 'setup.account_name_not_available',
    },
    kb: {
      sluggable: 'stash.kb_name_invalid',
    },
  };

  zones: Zone[] = [];
  failures = 0;
  loading = false;
  createdAccount?: string;
  createdKb?: string;

  constructor(
    private router: Router,
    private formBuilder: UntypedFormBuilder,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private zoneService: ZoneService,
    private navigation: NavigationService,
    private toaster: AppToasterService,
    private userService: UserService,
  ) {
    this.kb.patchValue(DEFAULT_KB_NAME);
    this.zoneService.getZones().subscribe((zones) => {
      this.zones = zones;
      if (this.zones.length === 1) {
        this.zone.patchValue(this.zones[0].id);
      }
      this.cdr.markForCheck();
    });
  }

  get account() {
    return this.accountForm.get('account')!;
  }

  get kb() {
    return this.accountForm.get('kb')!;
  }

  get zone() {
    return this.accountForm.get('zone')!;
  }

  save() {
    if (this.accountForm.invalid) return;

    const accountSlug = STFUtils.generateSlug(this.account.value);
    const accountData = {
      slug: accountSlug,
      title: this.account.value,
      zone: this.zone.value,
    };

    const kbSlug = STFUtils.generateSlug(this.kb.value);
    const kbData = {
      slug: kbSlug,
      zone: this.zone.value,
      title: this.kb.value,
    };

    this.loading = true;
    this.cdr.markForCheck();

    const createAccount = this.failures > 0 ? of({} as Account) : this.sdk.nuclia.db.createAccount(accountData);
    createAccount
      .pipe(
        catchError((error) => {
          this.toaster.error('login.error.oops');
          this.loading = false;
          this.cdr.markForCheck();
          throw error;
        }),
        concatMap(() => this.createKb(accountSlug, kbData)),
      )
      .subscribe(() => {
        this.createdAccount = accountSlug;
        this.createdKb = kbSlug;
        this.cdr.markForCheck();
      });
  }

  createKb(account: string, data: KnowledgeBoxCreation) {
    return this.sdk.nuclia.db.createKnowledgeBox(account, data).pipe(
      catchError((error) => {
        this.failures += 1;
        this.loading = false;
        this.account.disable();
        this.cdr?.markForCheck();
        if (this.failures < 4) {
          this.toaster.error('stash.create.error');
        } else {
          Sentry.captureMessage(`KB creation failed`, { tags: { host: location.hostname } });
          this.toaster.error('stash.create.failure');
        }
        throw error;
      }),
    );
  }

  uploadFile() {
    const path = this.navigation.getKbUrl(this.createdAccount!, this.createdKb!);
    this.router.navigate([path], { queryParams: { firstUpload: 'true' } });
  }

  availableAccountValidator(control: AbstractControl) {
    const slug = STFUtils.generateSlug(control.value);
    return this.sdk.nuclia.db
      .getAccountStatus(slug)
      .pipe(map((status) => (status.available ? null : { available: true })));
  }
}
