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
  requiresSiteUrlResolution = false;
  searchQuery = '';
  siteUrlControl = new FormControl('');
  requiresBucketSearch = false;
  bucketName = '';
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
    if (!this.requiresSearch && !this.requiresSiteUrlResolution && !this.requiresBucketSearch) {
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
      } else if (chunks.length === 2 && !this.currentDrive()) {
        // Drive-less providers (e.g. Dropbox): back to root
        this.currentPath.set('');
        this.loadFolders();
      } else if (chunks.length > 2) {
        const path = chunks.slice(0, chunks.length - 1).join('/');
        this.browseFolder(path);
      }
    } else if (this.currentDrive()) {
      this.currentDrive.set(undefined);
      if (!this.requiresBucketSearch) {
        this.loadFolders(this.currentSite() ? this.currentSite()?.id : undefined);
      }
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
