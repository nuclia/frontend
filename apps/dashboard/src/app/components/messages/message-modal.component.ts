import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  templateUrl: './message-modal.component.html',
  standalone: true,
  imports: [PaModalModule, TranslateModule, CommonModule, PaButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageModalComponent {
  data = this.modal.config.data;

  constructor(public modal: ModalRef) {}
}
