import {
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { SyncService } from '../logic';
import { ExternalConnection, StorageDrive, StorageFolder, StorageSite } from '@nuclia/core';

import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonMiniComponent, SisProgressModule } from '@nuclia/sistema';

@Component({
  standalone: true,
  imports: [ButtonMiniComponent, TranslateModule, SisProgressModule, PaButtonModule, PaIconModule, PaTextFieldModule],
  selector: 'nsy-cloud-folder',
  templateUrl: 'cloud-folder.component.html',
  styleUrls: ['cloud-folder.component.scss'],
})
export class CloudFolderComponent implements OnInit {
  @Input() externalConnection?: ExternalConnection;
  @Output() selection = new EventEmitter<{ sync_root_path: string; drive_id: string }>();
  currentSite = signal<StorageSite | undefined>(undefined);
  currentDrive = signal<StorageDrive | undefined>(undefined);
  currentPath = signal<string>('');
  selectedDrive = signal<string | undefined>(undefined);
  selectedPath = signal<string | undefined>(undefined);
  isCurrentSelected = computed(
    () =>
      this.selectedPath() === this.currentPath() ||
      (!this.currentPath() && this.selectedDrive() && this.currentDrive()?.id === this.selectedDrive()),
  );
  sites: StorageSite[] | undefined = undefined;
  drives: StorageDrive[] = [];
  folders: StorageFolder[] = [];
  hasSites = false;
  requiresSearch = false;
  searchQuery = '';
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(SyncService);
  loading = false;

  ngOnInit() {
    const capabilities = this.externalConnection?.capabilities;
    this.hasSites = !!capabilities?.has_sites;
    this.requiresSearch = !!capabilities?.requires_site_search;
    if (!this.requiresSearch) {
      this.loadFolders();
    }
  }

  loadFolders(site?: string, drive?: string, path?: string) {
    if (!this.externalConnection) {
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    const query = { site_id: site, drive_id: drive, path };
    this.syncService.getCloudFolders(this.externalConnection.id, query).subscribe((res) => {
      if (res.sites) {
        this.sites = res.sites;
      }
      if (res.drives) {
        this.drives = res.drives;
      }
      this.folders = res.folders || [];
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  browseSite(site: StorageSite) {
    this.currentSite.set(site);
    this.loadFolders(site.id);
  }

  browseDrive(drive: StorageDrive) {
    this.currentDrive.set(drive);
    this.loadFolders(undefined, drive.id);
  }

  browseFolder(path: string) {
    this.currentPath.set(path);
    this.loadFolders(undefined, this.currentDrive()?.id, path);
  }

  back() {
    if (this.currentPath()) {
      const chunks = this.currentPath().split('/');
      if (chunks.length === 2 && this.currentDrive()) {
        this.currentPath.set('');
        this.browseDrive(this.currentDrive() as StorageDrive);
      }
      if (chunks.length > 2) {
        const path = chunks.slice(0, length - 1).join('/');
        this.browseFolder(path);
      }
    } else if (this.currentDrive()) {
      this.currentDrive.set(undefined);
      this.loadFolders(this.currentSite() ? this.currentSite()?.id : undefined);
    } else {
      this.currentSite.set(undefined);
      if (!this.requiresSearch) {
        this.loadFolders();
      }
    }
  }

  selectDrive() {
    this.selectedPath.set(undefined);
    this.selectedDrive.set(this.currentDrive()?.id);
    this.selection.emit({ drive_id: this.currentDrive()?.id || '', sync_root_path: '' });
  }

  selectFolder() {
    this.selectedDrive.set(undefined);
    this.selection.emit({ drive_id: this.currentDrive()?.id || '', sync_root_path: this.currentPath() });
    this.selectedPath.set(this.currentPath());
    this.cdr.markForCheck();
  }

  searchSites() {
    if (!this.externalConnection) {
      return;
    }
    this.currentSite.set(undefined);
    this.currentDrive.set(undefined);
    if (!this.searchQuery) {
      this.sites = [];
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    this.syncService.getCloudFolders(this.externalConnection.id, { site_search: this.searchQuery }).subscribe((res) => {
      this.sites = res.sites || [];
      this.loading = false;
      this.cdr.markForCheck();
    });
  }
}
