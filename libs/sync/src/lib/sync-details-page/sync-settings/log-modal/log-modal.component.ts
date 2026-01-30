import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaDateTimeModule, PaModalModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { LogEntity } from '../../../logic';

@Component({
  imports: [CommonModule, PaDateTimeModule, PaModalModule, PaTableModule, PaButtonModule],
  templateUrl: './log-modal.component.html',
  styleUrl: './log-modal.component.scss',
})
export class LogModalComponent {
  log = this.modal.config.data;

  constructor(public modal: ModalRef<LogEntity>) {}
}
