import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  templateUrl: './dialog-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DialogExampleComponent {
  constructor(public modal: ModalRef) {}
}
