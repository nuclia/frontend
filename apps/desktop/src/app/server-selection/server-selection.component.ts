import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LOCAL_SYNC_SERVER, SYNC_SERVER_KEY, SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-server-selection',
  templateUrl: './server-selection.component.html',
  styleUrls: ['./server-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerSelectionComponent {
  serverUrl =
    localStorage.getItem(SYNC_SERVER_KEY) === LOCAL_SYNC_SERVER ? '' : localStorage.getItem(SYNC_SERVER_KEY) || '';

  constructor(private sync: SyncService) {}

  setLocalServer() {
    this.sync.setSyncServer({ url: '', local: true });
  }

  setExternalServer() {
    this.sync.setSyncServer({ url: this.serverUrl, local: false });
  }
}
