import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Workflow } from '@nuclia/core';
import { HintModule } from '../../../hint';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { JsonValidator } from '../../../validators';

@Component({
  imports: [
    CommonModule,
    ExpandableTextareaComponent,
    HintModule,
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './tool-parameters-modal.component.html',
  styleUrl: './tool-parameters-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolParametersModalComponent {
  form = new FormGroup({
    parameters: new FormControl('', { nonNullable: true, validators: [JsonValidator()] }),
    required: new FormControl('', { nonNullable: true }),
  });

  workflow: Workflow | undefined = this.modal.config.data?.workflow;

  example = {
    query: {
      description: 'User question',
      type: 'string',
    },
    user_id: {
      description: 'Id of the user',
      type: 'string',
    },
  };

  constructor(public modal: ModalRef<{ workflow: Workflow }>) {
    if (this.workflow) {
      this.form.setValue({
        parameters: JSON.stringify(this.workflow.parameters || {}, null, 2),
        required: (this.workflow.required || []).join('\n'),
      });
    }
  }

  cancel() {
    this.modal.close();
  }

  submit() {
    if (this.workflow) {
      const values = this.form.getRawValue();
      const required = values.required
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item);
      const parameters = JSON.parse(values.parameters || '{}');
      const workflow: Workflow = { ...this.workflow, required, parameters };
      this.modal.close(workflow);
    }
  }
}
