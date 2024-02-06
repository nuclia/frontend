import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SyncService } from '@nuclia/sync';

@Component({
  templateUrl: './upload-layout.component.html',
  styleUrls: ['./upload-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadLayoutComponent {
  hasSyncServer = this.syncService.hasSyncServer();
  isServerDown = this.syncService.isServerDown;

  constructor(private syncService: SyncService) {}
}
