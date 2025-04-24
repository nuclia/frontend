import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef, PaModalModule, PaTextFieldModule, PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  templateUrl: './task-duplicate-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
})
export class TaskDuplicateDialogComponent {
  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
  });
  constructor(public modal: ModalRef) {}

  close() {
    this.modal.close();
  }

  save() {
    this.modal.close(this.form.value.name);
  }
}
