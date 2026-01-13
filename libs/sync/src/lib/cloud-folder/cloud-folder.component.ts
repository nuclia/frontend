import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { SyncService } from '../logic';
import { StorageDrive, StorageFolder } from '@nuclia/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonMiniComponent, SisProgressModule } from '@nuclia/sistema';

@Component({
  standalone: true,
  imports: [CommonModule, ButtonMiniComponent, TranslateModule, SisProgressModule],
  selector: 'nsy-cloud-folder',
  templateUrl: 'cloud-folder.component.html',
  styleUrls: ['cloud-folder.component.scss'],
})
export class CloudFolderComponent implements OnInit {
  @Input() externalConnectorId = '';
  @Output() selection = new EventEmitter<{ sync_root_path: string; drive_id: string }>();
  selectedDrive: StorageDrive | undefined = undefined;
  currentPath: string | undefined = undefined;
  drives: StorageDrive[] = [];
  folders: StorageFolder[] = [];
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(SyncService);
  loading = false;

  ngOnInit() {
    this.loadFolders();
  }

  loadFolders(drive?: string, path?: string) {
    if (!this.externalConnectorId) {
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    this.syncService.getCloudFolders(this.externalConnectorId, drive, path).subscribe((res) => {
      if (res.drives) {
        this.drives = res.drives;
      }
      this.folders = res.folders || [];
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  browseDrive(drive: StorageDrive) {
    this.selectedDrive = drive;
    this.loadFolders(drive.id);
  }

  browseFolder(path: string) {
    if (!this.selectedDrive) {
      return;
    }
    this.currentPath = path;
    this.loadFolders(this.selectedDrive.id, path);
  }

  back() {
    if (this.currentPath) {
      const chunks = this.currentPath.split('/');
      if (chunks.length === 2 && this.selectedDrive) {
        this.currentPath = undefined;
        this.browseDrive(this.selectedDrive);
      }
      if (chunks.length > 2) {
        const path = chunks.slice(0, length - 1).join('/');
        this.browseFolder(path);
      }
    } else {
      this.selectedDrive = undefined;
      this.loadFolders();
    }
  }

  selectDrive(drive: StorageDrive) {
    this.selection.emit({ drive_id: drive.id, sync_root_path: '' });
  }

  selectFolder() {
    if (this.selectedDrive) {
      this.selection.emit({ drive_id: this.selectedDrive.id, sync_root_path: this.currentPath || '' });
    }
  }
}
