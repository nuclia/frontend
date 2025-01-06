import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, PaModalModule, PaTextFieldModule, PaButtonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-widget-dialog.component.html',
  styleUrl: './create-widget-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateWidgetDialogComponent implements AfterViewInit {
  name = new FormControl<string>('', { validators: [Validators.required], nonNullable: true });
  initialized = false;

  constructor(public modal: ModalRef) {}

  ngAfterViewInit() {
    this.initialized = true;
  }

  submitName() {
    this.modal.close(this.name.getRawValue());
  }
}
