import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ModalRef,
  PaButtonModule,
  PaDropdownModule,
  PaModalModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';

@Component({
  templateUrl: './modal-example.component.html',
  styleUrls: ['./modal-example.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, PaTextFieldModule, PaDropdownModule, PaButtonModule],
})
export class ModalExampleComponent {
  constructor(public modal: ModalRef) {}
}
