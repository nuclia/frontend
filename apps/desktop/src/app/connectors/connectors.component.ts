import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { SyncService } from '../sync/sync.service';
import { map } from 'rxjs';

@Component({
  selector: 'nde-connectors',
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectorsComponent {
  connectors = this.sync.sourceObs.pipe(map((sources) => sources.sort((a, b) => a.title.localeCompare(b.title))));

  @Output() select = new EventEmitter<string>();

  constructor(private sync: SyncService) {}

  onSelectConnector(id: string) {
    this.select.emit(id);
  }
}
