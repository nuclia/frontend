import { ChangeDetectionStrategy, Component } from '@angular/core';
import { openDesktop } from '../../utils';
import { UploadDialogService, UploadType } from '../../resources/upload-button/upload-dialog.service';
import { filter, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService } from '@flaps/core';
import { SyncService } from '@nuclia/sync';
import { StandaloneService } from '../../services';

@Component({
  selector: 'stf-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadDataComponent {
  standalone = this.standaloneService.standalone;
  isSyncEnabled = this.features.sync;
  hasSyncServer = this.standalone ? of(false) : this.syncService.hasSyncServer();
  isServerDown = this.standalone ? of(true) : this.syncService.isServerDown;

  constructor(
    private uploadService: UploadDialogService,
    private router: Router,
    private route: ActivatedRoute,
    private features: FeaturesService,
    private syncService: SyncService,
    private standaloneService: StandaloneService,
  ) {}

  selectUpload(type: UploadType) {
    this.uploadService
      .upload(type)
      .onClose.pipe(filter((data) => !data || !data.cancel))
      .subscribe(() => this.router.navigate(['../resources/pending'], { relativeTo: this.route }));
  }

  openDesktop() {
    openDesktop();
  }

  setupSync() {
    this.router.navigate(['./sync/setup/server'], { relativeTo: this.route });
  }

  onSelectConnector(connectorId: string) {
    this.router.navigate(['./sync/add/', connectorId], { relativeTo: this.route });
  }
}
