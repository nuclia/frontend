import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IError } from '@nuclia/core';

@Component({
  selector: 'stf-warning-modal',
  imports: [CommonModule, PaModalModule, PaTableModule, TranslateModule, PaButtonModule],
  templateUrl: './warning-modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './warning-modal.component.scss',
})
export class WarningModalComponent {
  errors = this.modal.config.data?.errors || [];

  constructor(public modal: ModalRef<{ errors: IError[] }>) {}
}
