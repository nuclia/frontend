import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Sluggable } from '@flaps/common';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-add-widget',
  templateUrl: './add-widget.component.html',
  styleUrls: ['./add-widget.component.scss'],
})
export class AddWidgetDialogComponent {
  mainForm = this.fb.group({
    id: ['', [Validators.required, Sluggable()]],
  });
  validationMessages = {
    sluggable: 'stash.widgets.invalid-id',
  } as IErrorMessages;

  constructor(
    private dialogRef: MatDialogRef<AddWidgetDialogComponent>,
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: { rename: boolean },
  ) {}

  close() {
    this.dialogRef.close({});
  }

  save() {
    this.dialogRef.close(this.mainForm.value);
  }
}
