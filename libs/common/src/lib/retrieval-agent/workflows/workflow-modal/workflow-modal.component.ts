import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { STFUtils } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Workflow } from '@nuclia/core';

@Component({
  selector: 'app-nuclia-driver-modal',
  imports: [PaButtonModule, PaModalModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './workflow-modal.component.html',
  styleUrl: '../../drivers/driver-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowModalComponent {
  form = new FormGroup({
    id: new FormControl<string>('', { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true }),
  });

  workflow: Workflow | undefined = this.modal.config.data?.workflow;
  workflows: Workflow[] = this.modal.config.data?.workflows || [];
  isEdit = !!this.workflow;

  constructor(public modal: ModalRef<{ workflow: Workflow; workflows: Workflow[] }>) {
    if (this.workflow) {
      this.form.patchValue(this.workflow);
    }
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.form.valid) {
      const values: Workflow = this.form.getRawValue();
      if (!this.isEdit) {
        values.id = STFUtils.generateUniqueSlug(
          values.name,
          this.workflows.map((item) => item.id),
        );
      }
      if (this.isEdit) {
        values.parameters = {};
      }
      this.modal.close(values);
    }
  }
}
