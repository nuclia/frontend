import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LOCAL_SYNC_SERVER, SYNC_SERVER_KEY, SyncService } from '../../sync/sync.service';

@Component({
  selector: 'nde-sync-server',
  templateUrl: 'sync-server.component.html',
  styleUrls: ['sync-server.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncServerComponent {
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
