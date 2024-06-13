import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [CommonModule, PaModalModule, PaTextFieldModule, PaButtonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './rename-widget-dialog.component.html',
  styleUrl: './rename-widget-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenameWidgetDialogComponent implements AfterViewInit {
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
