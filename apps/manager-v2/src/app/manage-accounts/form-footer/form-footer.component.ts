import { AsyncPipe } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { ManagerStore } from '../../manager.store';

@Component({
  selector: 'nma-form-footer',
  templateUrl: './form-footer.component.html',
  styleUrls: ['./form-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaButtonModule, AsyncPipe],
})
export class FormFooterComponent {
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) secondary = false;

  @Output() footerCancel: EventEmitter<void> = new EventEmitter<void>();

  private store = inject(ManagerStore);
  canEdit = this.store.canEdit;
}
