import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'nma-form-footer',
  templateUrl: './form-footer.component.html',
  styleUrls: ['./form-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFooterComponent {
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) secondary = false;

  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
}
