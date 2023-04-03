import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SyncService } from '../../sync/sync.service';

@Component({
  selector: 'nde-sync-server',
  templateUrl: 'sync-server.component.html',
  styleUrls: ['sync-server.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncServerComponent {
  serverUrl = '';

  constructor(private sync: SyncService) {}

  setLocalServer() {
    this.sync.setSyncServer({ url: '', local: true });
  }

  setExternalServer() {
    this.sync.setSyncServer({ url: this.serverUrl, local: false });
  }
}
