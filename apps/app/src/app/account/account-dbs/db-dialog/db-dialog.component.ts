import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { Observable, switchMap, take, filter } from 'rxjs'
import { Account } from '@nuclia/core';
import { StateService } from '@flaps/auth';
import { Zone, NucliaDBMeta, NucliaDBKeyCreation, NucliaDBService } from '@flaps/core';

export interface DBDialogData {
  zones: Zone[];
  nucliaDB?: NucliaDBMeta;
}

@Component({
  selector: 'app-db-dialog',
  templateUrl: './db-dialog.component.html',
  styleUrls: ['./db-dialog.component.scss']
})
export class DBDialogComponent implements OnInit {

  account = this.stateService.account.pipe(
    filter((account) => !!account),
    take(1)
  ) as Observable<Account>;

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
    private stateService: StateService,
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
      this.account.subscribe((account) => {
        this.dbForm.get('zone')?.patchValue(account.zone);
      });
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
    this.account
      .pipe(switchMap((account) => this.nucliaDBService.createKey(account.slug, data)))
      .subscribe(res => { this.dialogRef.close(res.token) });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}