import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SyncService } from '@nuclia/sync';
import { StandaloneService } from '../../services';
import { map, of } from 'rxjs';

@Component({
  templateUrl: './upload-layout.component.html',
  styleUrls: ['./upload-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadLayoutComponent {
  standalone = this.standaloneService.standalone;
  hasSyncServer = this.standalone ? of(false) : this.syncService.syncServer.pipe(map((server) => !!server));
  isServerDown = this.standalone ? of(true) : this.syncService.isServerDown;

  constructor(
    private syncService: SyncService,
    private standaloneService: StandaloneService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  setupSync() {
    this.router.navigate(['./sync/setup/server'], { relativeTo: this.route });
  }
}
