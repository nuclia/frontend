import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { take, filter, map } from 'rxjs'
import { Account, NUAClient } from '@nuclia/core';
import { StateService, UserService } from '@flaps/auth';
import { Zone } from '@flaps/core';
import { AccountNUAService } from '../account-nua.service';

export interface ClientDialogData {
  zones: Zone[];
  client?: NUAClient;
}

@Component({
  selector: 'app-client-dialog',
  templateUrl: './client-dialog.component.html',
  styleUrls: ['./client-dialog.component.scss']
})
export class ClientDialogComponent {

  account = this.stateService.account.pipe(
    filter((account): account is Account => !!account),
    take(1)
  );

  email = this.userService.userPrefs.pipe(
    filter((prefs) => !!prefs),
    map((prefs) => prefs!.email),
    take(1)
  );

  editMode: boolean;

  clientForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    zone: ['', [Validators.required]],
  });
  
  validationMessages = {
    title: {
      required: 'validation.required',
    },
    email: {
      required: 'validation.required',
      email: 'validation.email',
    }
  };

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<ClientDialogComponent>,
    private stateService: StateService,
    private userService: UserService,
    private nua: AccountNUAService,
    @Inject(MAT_DIALOG_DATA) public data: ClientDialogData
  ) {
    this.editMode  = !!this.data.client;
    
    if (this.data.client) {
      this.clientForm.get('title')?.patchValue(this.data.client.title);
      this.clientForm.get('email')?.patchValue(this.data.client.contact);
      this.clientForm.get('zone')?.patchValue(this.data.client.zone);
    }
    else {
      this.account.subscribe((account) => {
        this.clientForm.get('zone')?.patchValue(account.zone);
      });
      this.email.subscribe((email) => {
        this.clientForm.get('email')?.patchValue(email);
      })
    }
  }

  save() {
    if (this.clientForm.invalid) return;
    if (!this.editMode) {
      this.create();
    }
    else {
      // TODO: edit
      this.dialogRef.close(true);
    }
  }

  create(): void {
    const payload = {
      title: this.clientForm.value.title,
      contact: this.clientForm.value.email,
    }
    this.nua.createClient(payload).subscribe(({ token }) => {
      this.dialogRef.close(token)
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}