import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { filter, map, take, tap } from 'rxjs';
import { NUAClient } from '@nuclia/core';
import { SDKService, STFTrackingService, UserService, Zone, ZoneService } from '@flaps/core';
import { AccountNUAService } from '../account-nua.service';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

export interface ClientDialogData {
  client?: NUAClient;
}

@Component({
  templateUrl: './client-dialog.component.html',
  styleUrls: ['./client-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDialogComponent implements OnInit {
  account = this.sdkService.currentAccount.pipe(take(1));

  email = this.userService.userPrefs.pipe(
    filter((prefs) => !!prefs),
    map((prefs) => prefs!.email),
    take(1),
  );

  editMode: boolean;

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

  zones: Zone[] = [];

  isAllowKbManagementEnabled = this.tracking.isFeatureEnabled('allow-kb-management-from-nua-key');

  constructor(
    public modal: ModalRef,
    private userService: UserService,
    private nua: AccountNUAService,
    private sdkService: SDKService,
    private cdr: ChangeDetectorRef,
    private zoneService: ZoneService,
    private tracking: STFTrackingService,
  ) {
    this.editMode = !!this.modal.config.data?.['client'];
  }

  ngOnInit() {
    this.zoneService
      .getZones()
      .pipe(
        tap((zones) => {
          this.zones = zones;
          this.cdr.detectChanges();
        }),
      )
      .subscribe(() => {
        if (this.modal.config.data?.['client']) {
          this.clientForm.patchValue(this.modal.config.data['client']);
          this.cdr.markForCheck();
        } else {
          this.account.subscribe((account) => {
            this.clientForm.get('zone')?.patchValue(account.zone);
            this.cdr.markForCheck();
          });
          this.email.subscribe((email) => {
            this.clientForm.get('contact')?.patchValue(email);
            this.cdr.markForCheck();
          });
        }
      });
  }

  save() {
    if (this.clientForm.invalid) return;
    if (!this.editMode) {
      this.create();
    } else {
      // TODO: edit
      this.modal.close(true);
    }
  }

  create(): void {
    const { zone, ...payload } = this.clientForm.getRawValue();
    this.nua.createClient(payload, zone).subscribe(({ token }) => {
      this.modal.close(token);
    });
  }

  close(): void {
    this.modal.close(false);
  }
}
