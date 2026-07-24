import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, map, shareReplay, take, tap } from 'rxjs';
import { NUAClient } from '@nuclia/core';
import { BillingService, FeaturesService, SDKService, UserService, ZoneService } from '@flaps/core';
import { AccountNUAService } from '../account-nua.service';
import { ModalRef, OptionModel } from '@guillotinaweb/pastanaga-angular';

export interface ClientDialogData {
  client?: NUAClient;
}

@Component({
  templateUrl: './client-dialog.component.html',
  styleUrls: ['./client-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ClientDialogComponent implements OnInit {
  private billingService = inject(BillingService);

  account = this.sdkService.currentAccount.pipe(take(1));
  hasSubscription = this.billingService.getSubscription().pipe(map((subscription) => !!subscription));

  email = this.userService.userPrefs.pipe(
    filter((prefs) => !!prefs),
    map((prefs) => prefs!.email),
    take(1),
  );

  data = this.modal.config.data?.client;
  editMode = !!this.data;

  clientForm = new FormGroup({
    title: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    contact: new FormControl<string>('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    allow_kb_management: new FormControl<boolean>(false, { nonNullable: true }),
    has_limit: new FormControl<boolean>(false, { nonNullable: true }),
    tokens_limit: new FormControl<number | null>(null, { nonNullable: true, validators: [Validators.min(0)] }),
    webhook: new FormControl<string>('', { nonNullable: true }),
    zone: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  validationMessages = {
    title: {
      required: 'validation.required',
    },
    email: {
      required: 'validation.required',
      email: 'validation.email',
    },
  };

  zones = this.zoneService.getZones().pipe(
    take(1),
    map((zones) => zones.map((zone) => new OptionModel({ id: zone.slug, value: zone.slug, label: zone.title || '' }))),
    shareReplay(1),
  );

  allowKbManagementAuthorized = this.features.authorized.allowKbManagementFromNuaKey.pipe(
    tap((authorized) => {
      if (authorized) {
        this.clientForm.controls.allow_kb_management.enable();
      } else {
        this.clientForm.controls.allow_kb_management.disable();
      }
    }),
  );

  get hasLimit() {
    return this.clientForm.controls.has_limit.value;
  }

  constructor(
    public modal: ModalRef<ClientDialogData>,
    private userService: UserService,
    private nua: AccountNUAService,
    private sdkService: SDKService,
    private cdr: ChangeDetectorRef,
    private zoneService: ZoneService,
    private features: FeaturesService,
  ) {}

  ngOnInit() {
    if (!this.editMode) {
      this.email.subscribe((email) => {
        this.clientForm.get('contact')?.patchValue(email);
        this.cdr.markForCheck();
      });
    }

    this.zones.pipe(take(1)).subscribe((zones) => {
      if (this.data) {
        this.clientForm.patchValue({ ...this.data, has_limit: typeof this.data.tokens_limit === 'number' });
        this.clientForm.controls.allow_kb_management.disable();
      } else {
        this.clientForm.get('zone')?.patchValue(zones.length === 1 ? zones[0].value : '');
      }
      this.cdr.markForCheck();
    });
  }

  save() {
    if (this.clientForm.invalid) return;
    const { zone, has_limit, ...payload } = this.clientForm.getRawValue();
    const tokens_limit = this.hasLimit ? payload.tokens_limit : null;
    if (this.data) {
      this.nua
        .editClient(this.data.internal_id, { title: payload.title, contact: payload.contact, tokens_limit }, zone)
        .subscribe(() => {
          this.modal.close(true);
        });
    } else {
      this.nua.createClient({ ...payload, tokens_limit }, zone).subscribe(({ token }) => {
        this.modal.close(token);
      });
    }
  }

  close(): void {
    this.modal.close(false);
  }
}
