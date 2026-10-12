import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  templateUrl: './task-duplicate-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslatePipe],
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
