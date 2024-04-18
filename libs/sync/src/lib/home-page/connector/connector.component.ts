import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaCardModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  standalone: true,
  selector: 'nsy-connector',
  imports: [CommonModule, PaCardModule, PaIconModule, PaIconModule],
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) logo = '';
  @Input({ transform: booleanAttribute }) disabled = false;

  @Output() selectConnector: EventEmitter<MouseEvent | KeyboardEvent> = new EventEmitter<MouseEvent | KeyboardEvent>();
}
