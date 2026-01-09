import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CodeEditorComponent } from '../code-editor.component';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  imports: [
    forwardRef(() => CodeEditorComponent), // Avoid circular dependency
    PaButtonModule,
    PaModalModule,
    TranslateModule,
  ],
  templateUrl: './code-editor-modal.component.html',
  styleUrl: './code-editor-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorModalComponent {
  title = '';
  form = new FormGroup({
    code: new FormControl<string>('', { nonNullable: true }),
  });

  constructor(public modal: ModalRef<{ title: string, value: string }, string>) {
    if (this.modal.config.data) {
      this.title = this.modal.config.data.title;
      this.form.controls.code.setValue(this.modal.config.data.value);
    }
  }

  edit() {
    this.modal.close(this.form.controls.code.value);
  }
}
