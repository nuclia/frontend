import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { of, Subject, take } from 'rxjs';
import { catchError, concatMap, takeUntil } from 'rxjs/operators';
import { SDKService, STFTrackingService, STFUtils, Zone, ZoneService } from '@flaps/core';
import { Sluggable } from '@flaps/common';
import { NavigationService } from '../../services/navigation.service';
import { SetupStep } from '../setup-header/setup-header.component';
import { SisModalService } from '@nuclia/sistema';
import { Account, KnowledgeBoxCreation } from '@nuclia/core';

@Component({
  selector: 'app-setup-step2',
  templateUrl: './setup-step2.component.html',
  styleUrls: ['./setup-step2.component.scss'],
})
export class SetupStep2Component implements OnInit, OnDestroy, AfterViewInit {
  step = SetupStep.Account;
  isSignup: boolean = false;

  accountForm = this.formBuilder.group({
    accountName: ['', [Sluggable()]],
  });

  kbForm = this.formBuilder.group({
    kbName: ['', [Sluggable()]],
    kbZone: ['', [Validators.required]],
  });

  zones: Zone[] = [];
  verified: boolean = false;
  available: boolean = false;
  editKbName: boolean = true;
  loading: boolean = false;
  failures: number = 0;
  verifyDisabled: boolean = false;
  unsubscribeAll = new Subject<void>();

  @ViewChild('accountInput') accountInput: ElementRef | undefined;
  @ViewChild('kbInput') kbInput: ElementRef | undefined;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: UntypedFormBuilder,
    private sdk: SDKService,
    private zoneService: ZoneService,
    private navigation: NavigationService,
    private tracking: STFTrackingService,
    private modalService: SisModalService,
  ) {
    this.tracking
      .isFeatureEnabled('onboarding-v2')
      .pipe(take(1))
      .subscribe((enabled) => {
        if (enabled) this.router.navigate(['/setup/account-config']);
      });

    this.zoneService.getZones().subscribe((zones) => {
      this.zones = zones;
      if (this.zones.length === 1) {
        this.kbZone.patchValue(this.zones[0].id);
      }
    });
  }

  ngOnInit(): void {
    this.isSignup = this.route.snapshot.queryParams.signup === 'true';
    this.accountName.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.reset();
    });
  }

  reset() {
    this.verified = false;
    this.available = false;
    this.editKbName = false;
    this.kbName.setValue('');
  }

  ngAfterViewInit() {
    this.accountInput?.nativeElement.focus();
  }

  get accountName() {
    return this.accountForm.get('accountName')!;
  }

  get kbName() {
    return this.kbForm.get('kbName')!;
  }

  get kbZone() {
    return this.kbForm.get('kbZone')!;
  }

  checkAccount() {
    if (this.accountForm.invalid) return;

    const slug = STFUtils.generateSlug(this.accountName.value);
    this.sdk.nuclia.db.getAccountStatus(slug).subscribe((status) => {
      this.verified = true;
      this.available = status.available;
      this.kbName.setValue(this.accountName.value);
    });
    return false;
  }

  edit() {
    this.editKbName = true;
    setTimeout(() => {
      this.kbInput?.nativeElement.focus();
    }, 0);
  }

  save() {
    this.kbForm.markAllAsTouched();
    if (this.kbForm.invalid) return;

    const accountSlug = STFUtils.generateSlug(this.accountName.value);
    const accountData = {
      slug: accountSlug,
      title: this.accountName.value,
      zone: this.kbZone.value,
    };

    const kbSlug = STFUtils.generateSlug(this.kbName.value);
    const kbData = {
      slug: kbSlug,
      zone: this.kbZone.value,
      title: this.kbName.value,
    };

    this.loading = true;
    const createAccount = this.failures > 0 ? of({} as Account) : this.sdk.nuclia.db.createAccount(accountData);
    createAccount.pipe(concatMap(() => this.createKb(accountSlug, kbData))).subscribe({
      next: () => {
        this.nextStep(accountSlug, kbSlug);
        this.loading = false;
      },
      error: () => {
        this.showGenericError();
        this.loading = false;
      },
    });
  }

  createKb(accountSlug: string, kbData: KnowledgeBoxCreation) {
    return this.sdk.nuclia.db.createKnowledgeBox(accountSlug, kbData).pipe(
      catchError((error) => {
        this.failures += 1;
        this.accountForm.disable({ emitEvent: false });
        this.verifyDisabled = true;
        throw error;
      }),
    );
  }

  showGenericError() {
    this.modalService.openConfirm({
      title: 'login.error.oops',
      description: 'stash.create.error',
      confirmLabel: 'Ok',
      onlyConfirm: true,
    });
  }

  nextStep(accountSlug: string, kbSlug: string) {
    const path = this.navigation.getKbUrl(accountSlug, kbSlug);
    this.router.navigate([path]);
  }

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
