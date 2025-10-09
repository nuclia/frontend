import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { ManagerStore } from '../../manager.store';

@Component({
  selector: 'nma-form-footer',
  templateUrl: './form-footer.component.html',
  styleUrls: ['./form-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FormFooterComponent {
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) secondary = false;

  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  private store = inject(ManagerStore);
  canEdit = this.store.canEdit;
}
