import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SyncService } from '@nuclia/sync';
import { StandaloneService } from '../../services';
import { of } from 'rxjs';

@Component({
  templateUrl: './upload-layout.component.html',
  styleUrls: ['./upload-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadLayoutComponent {
  standalone = this.standaloneService.standalone;
  hasSyncServer = this.standalone ? of(false) : this.syncService.hasSyncServer();
  isServerDown = this.standalone ? of(true) : this.syncService.isServerDown;

  constructor(
    private syncService: SyncService,
    private standaloneService: StandaloneService,
  ) {}
}
