import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { filter, map, take, tap } from 'rxjs';
import { Account, NUAClient } from '@nuclia/core';
import { SDKService, StateService, UserService } from '@flaps/core';
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
  account = this.stateService.account.pipe(
    filter((account): account is Account => !!account),
    take(1),
  );

  email = this.userService.userPrefs.pipe(
    filter((prefs) => !!prefs),
    map((prefs) => prefs!.email),
    take(1),
  );

  editMode: boolean;

  clientForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    allow_kb_management: [false],
    webhook: [''],
    zone: ['', [Validators.required]],
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

  zones: { id: string; title: string }[] = [];

  constructor(
    public modal: ModalRef,
    private formBuilder: UntypedFormBuilder,
    private stateService: StateService,
    private userService: UserService,
    private nua: AccountNUAService,
    private sdkService: SDKService,
    private cdr: ChangeDetectorRef,
  ) {
    this.editMode = !!this.modal.config.data?.['client'];
  }

  ngOnInit() {
    this.sdkService.nuclia.rest
      .getZones()
      .pipe(
        map((zoneMap) => Object.entries(zoneMap).map(([key, title]) => ({ id: key, title }))),
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
            this.clientForm.get('email')?.patchValue(email);
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
    const payload = {
      title: this.clientForm.value.title,
      contact: this.clientForm.value.email,
      allow_kb_management: this.clientForm.value.allow_kb_management,
      webhook: this.clientForm.value.webhook,
    };
    this.nua.createClient(payload).subscribe(({ token }) => {
      this.modal.close(token);
    });
  }

  close(): void {
    this.modal.close(false);
  }
}
