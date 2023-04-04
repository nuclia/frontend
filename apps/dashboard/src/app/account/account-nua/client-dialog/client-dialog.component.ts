import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { filter, map, Observable, take } from 'rxjs';
import { Account, NUAClient } from '@nuclia/core';
import { SDKService, StateService, UserService } from '@flaps/core';
import { AccountNUAService } from '../account-nua.service';

export interface ClientDialogData {
  client?: NUAClient;
}

@Component({
  selector: 'app-client-dialog',
  templateUrl: './client-dialog.component.html',
  styleUrls: ['./client-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDialogComponent {
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

  zones: Observable<{ id: string; title: string }[]> = this.sdkService.nuclia.rest
    .getZones()
    .pipe(map((zoneMap) => Object.entries(zoneMap).map(([key, title]) => ({ id: key, title }))));

  constructor(
    private formBuilder: UntypedFormBuilder,
    private dialogRef: MatDialogRef<ClientDialogComponent>,
    private stateService: StateService,
    private userService: UserService,
    private nua: AccountNUAService,
    private sdkService: SDKService,
    private cdr: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: ClientDialogData,
  ) {
    this.editMode = !!this.data.client;

    if (this.data.client) {
      this.clientForm.patchValue(this.data.client);
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
  }

  save() {
    if (this.clientForm.invalid) return;
    if (!this.editMode) {
      this.create();
    } else {
      // TODO: edit
      this.dialogRef.close(true);
    }
  }

  create(): void {
    const payload = {
      title: this.clientForm.value.title,
      contact: this.clientForm.value.email,
      webhook: this.clientForm.value.webhook,
    };
    this.nua.createClient(payload).subscribe(({ token }) => {
      this.dialogRef.close(token);
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
