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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SyncService } from '../logic';
import { ExternalConnection, StorageDrive, StorageFolder, StorageSite } from '@nuclia/core';

import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ButtonMiniComponent,
  SisProgressModule,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';

@Component({
  standalone: true,
  imports: [
    ButtonMiniComponent,
    ReactiveFormsModule,
    TranslateModule,
    SisProgressModule,
    TwoColumnsConfigurationItemComponent,
    PaButtonModule,
    PaIconModule,
    PaTextFieldModule,
  ],
  selector: 'nsy-cloud-folder',
  templateUrl: 'cloud-folder.component.html',
  styleUrls: ['cloud-folder.component.scss'],
})
export class CloudFolderComponent implements OnInit {
  private toaster = inject(SisToastService);

  @Input() externalConnection?: ExternalConnection;
  @Output() selection = new EventEmitter<{ sync_root_path?: string; folder_id?: string; drive_id: string }>();
  currentSite = signal<StorageSite | undefined>(undefined);
  currentDrive = signal<StorageDrive | undefined>(undefined);
  currentFolder = signal<StorageFolder[]>([]);
  selectedFolder = signal<StorageFolder | undefined>(undefined);
  isCurrentSelected = computed(
    () => this.selectedFolder() && this.selectedFolder()?.path === this.currentFolder().at(-1)?.path,
  );
  hasCurrentFolder = computed(() => this.currentFolder().length > 0);
  sites: StorageSite[] | undefined = undefined;
  drives: StorageDrive[] = [];
  folders: StorageFolder[] = [];
  hasSites = false;
  requiresSearch = false;
  requiresSiteUrlResolution = false;
  searchQuery = '';
  siteUrlControl = new FormControl('');
  requiresBucketSearch = false;
  bucketName = '';
  usePath = false;
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(SyncService);
  private translate = inject(TranslateService);
  loading = false;

  ngOnInit() {
    const capabilities = this.externalConnection?.capabilities;
    this.hasSites = !!capabilities?.has_sites;
    this.requiresSearch = !!capabilities?.requires_site_search;
    this.requiresSiteUrlResolution = !!capabilities?.requires_site_url_resolution;
    this.requiresBucketSearch = this.externalConnection?.provider === 'aws_s3_assume_role';
    this.usePath = this.externalConnection?.provider === 'aws_s3_assume_role';
    if (!this.requiresSearch && !this.requiresSiteUrlResolution && !this.requiresBucketSearch) {
      this.loadFolders();
    }
  }

  loadFolders(site?: string, drive?: string, folder?: StorageFolder) {
    if (!this.externalConnection) {
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    const query = {
      site_id: site,
      drive_id: drive,
      path: this.usePath ? folder?.path : undefined,
      folder_id: !this.usePath ? folder?.id : undefined,
    };
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

  browseFolder(folder: StorageFolder) {
    this.currentFolder.update((current) => [...current, folder]);
    this.loadFolders(undefined, this.currentDrive()?.id, folder);
  }

  back() {
    if (this.currentFolder().length > 0) {
      if (this.currentFolder().length === 1 && this.currentDrive()) {
        this.currentFolder.set([]);
        this.browseDrive(this.currentDrive() as StorageDrive);
      } else if (this.currentFolder().length === 1 && !this.currentDrive()) {
        // Drive-less providers (e.g. Dropbox): back to root
        this.currentFolder.set([]);
        this.loadFolders();
      } else if (this.currentFolder().length > 1) {
        const prevFolder = this.currentFolder().at(-2);
        this.currentFolder.update((current) => current.slice(0, -1));
        this.loadFolders(undefined, this.currentDrive()?.id, prevFolder!);
      }
    } else if (this.currentDrive()) {
      this.currentDrive.set(undefined);
      this.loadFolders(this.currentSite() ? this.currentSite()?.id : undefined);
    } else {
      this.currentSite.set(undefined);
      if (this.requiresSiteUrlResolution) {
        this.siteUrlControl.setErrors(null);
      }
      if (!this.requiresSearch && !this.requiresSiteUrlResolution) {
        this.loadFolders();
      }
    }
  }

  selectFolder() {
    const folder = this.currentFolder().at(-1);
    this.selection.emit({
      drive_id: this.currentDrive()?.id || '',
      sync_root_path: this.usePath ? folder?.path || '' : undefined,
      folder_id: !this.usePath ? folder?.id || '' : undefined,
    });
    this.selectedFolder.set(folder);
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

  resolveAndBrowseSite() {
    if (!this.externalConnection) {
      return;
    }
    if (!this.siteUrlControl.value?.trim()) {
      this.siteUrlControl.markAsDirty();
      this.siteUrlControl.setErrors({ customError: this.translate.instant('sync.cloud-folder.site-url-required') });
      this.cdr.markForCheck();
      return;
    }
    this.siteUrlControl.setErrors(null);
    this.loading = true;
    this.cdr.markForCheck();
    this.syncService.resolveSite(this.externalConnection.id, this.siteUrlControl.value).subscribe({
      next: (site) => {
        this.loading = false;
        this.browseSite(site);
      },
      error: () => {
        this.siteUrlControl.markAsDirty();
        this.siteUrlControl.setErrors({ customError: this.translate.instant('sync.cloud-folder.site-url-error') });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  validateAndBrowseDrive(drive: string) {
    if (!this.externalConnection) {
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    this.syncService.getCloudFolders(this.externalConnection.id, { drive_id: drive }).subscribe({
      next: () => {
        this.browseDrive({ id: drive, name: drive });
      },
      error: () => {
        this.toaster.error('sync.cloud-folder.drive-error');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
