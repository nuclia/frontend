import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'nde-connector',
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorComponent {
  @Input() title?: string;
  @Input() logo?: string;
  @Input() description?: string;
}
