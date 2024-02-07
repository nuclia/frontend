import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SyncService } from '../sync/sync.service';
import { map } from 'rxjs';

@Component({
  selector: 'nsy-connectors',
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorsComponent {
  @Input() disabled = false;

  connectors = this.sync.sourceObs.pipe(map((sources) => sources.sort((a, b) => a.title.localeCompare(b.title))));

  @Output() selectConnector = new EventEmitter<string>();

  constructor(private sync: SyncService) {}

  onSelectConnector(id: string) {
    this.selectConnector.emit(id);
  }
}
