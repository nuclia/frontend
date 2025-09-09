import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';

import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [PaModalModule, PaTextFieldModule, PaButtonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './duplicate-widget-dialog.component.html',
  styleUrl: './duplicate-widget-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateWidgetDialogComponent implements AfterViewInit {
  name = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });
  initialized = false;

  constructor(public modal: ModalRef<{ name: string }>) {}

  ngAfterViewInit() {
    this.initialized = true;
  }

  submitName() {
    this.modal.close(this.name.getRawValue());
  }
}
