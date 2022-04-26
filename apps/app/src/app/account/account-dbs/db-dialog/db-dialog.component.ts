import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { Account } from '@flaps/auth';
import { Zone, NucliaDBMeta, NucliaDBKeyCreation, NucliaDBService } from '@flaps/core';

export interface DBDialogData {
  account: Account;
  zones: Zone[];
  nucliaDB?: NucliaDBMeta;
}

@Component({
  selector: 'app-db-dialog',
  templateUrl: './db-dialog.component.html',
  styleUrls: ['./db-dialog.component.scss']
})
export class DBDialogComponent implements OnInit {

  editMode: boolean;

  dbForm = this.formBuilder.group({
    title: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    description: [''],
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
    private dialogRef: MatDialogRef<DBDialogComponent>,
    private nucliaDBService: NucliaDBService,
    @Inject(MAT_DIALOG_DATA) public data: DBDialogData
  ) {
    this.editMode  = !!this.data.nucliaDB;
    
    if (this.data.nucliaDB) {
      this.dbForm.get('title')?.patchValue(this.data.nucliaDB.title);
      this.dbForm.get('email')?.patchValue(this.data.nucliaDB.contact);
      this.dbForm.get('description')?.patchValue(this.data.nucliaDB.description);
      this.dbForm.get('zone')?.patchValue(this.data.nucliaDB.zone);
    }
    else {
      this.dbForm.get('zone')?.patchValue(this.data.account.zone);
    }
  }

  ngOnInit(): void {
  }

  save() {
    if (this.dbForm.invalid) return;
    if (!this.editMode) {
      this.create();
    }
    else {
      // TODO: edit
      this.dialogRef.close(true);
    }
  }

  create(): void {
    const data: NucliaDBKeyCreation = {
      title: this.dbForm.value.title,
      contact: this.dbForm.value.email,
      description: this.dbForm.value.description,
    }
    this.nucliaDBService.createKey(this.data.account.slug, data).subscribe(res => {
      this.dialogRef.close(res.token);
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}