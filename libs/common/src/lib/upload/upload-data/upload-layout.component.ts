import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SyncService } from '@nuclia/sync';
@Component({
  templateUrl: './upload-layout.component.html',
  styleUrls: ['./upload-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadLayoutComponent {
  hasSyncServer = this.syncService.hasSyncServer();
  isServerDown = this.syncService.isServerDown;

  constructor(
    private router: Router,
    private syncService: SyncService,
    private route: ActivatedRoute,
  ) {}

  setupSync() {
    this.router.navigate(['./sync/setup/server'], { relativeTo: this.route });
  }
}
