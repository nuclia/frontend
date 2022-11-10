import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  templateUrl: './modal-example.component.html',
  styleUrls: ['./modal-example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalExampleComponent {
  constructor(public modal: ModalRef) {}
}
