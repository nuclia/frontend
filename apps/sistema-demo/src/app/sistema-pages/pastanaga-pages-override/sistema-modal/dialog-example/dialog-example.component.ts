import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  templateUrl: './dialog-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, PaTextFieldModule, PaButtonModule],
})
export class DialogExampleComponent {
  constructor(public modal: ModalRef) {}
}
