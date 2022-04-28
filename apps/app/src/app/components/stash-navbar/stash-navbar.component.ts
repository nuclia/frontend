import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, animate, style, transition } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { Subject, map, shareReplay } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppService } from '../../services/app.service';
import { NavigationService } from '../../services/navigation.service';
import { CreateLinkComponent } from '../../upload/create-link/create-link.component';
import { UploadFilesDialogComponent } from '../../upload/upload-files/upload-files-dialog.component';
import { STFTrackingService, SDKService } from '@flaps/auth';

@Component({
  selector: 'app-stash-navbar',
  templateUrl: './stash-navbar.component.html',
  styleUrls: ['./stash-navbar.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate('150ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class StashNavbarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isUnfolded: boolean = false;

  kbUrl: string = '';
  showQuickStart: boolean = false;
  unsubscribeAll = new Subject<void>();
  isLinkEnabled = this.tracking.isFeatureEnabled('upload-link').pipe(shareReplay(1));
  isUploadEnabled = this.tracking.isFeatureEnabled('upload-files').pipe(shareReplay(1));
  isUploadFolderEnabled = this.tracking.isFeatureEnabled('upload-folder').pipe(shareReplay(1));
  isResourcesEnabled = this.tracking.isFeatureEnabled('view-resources').pipe(shareReplay(1));
  isActivityEnabled = this.tracking.isFeatureEnabled('view-activity').pipe(shareReplay(1));
  isOntologiesEnabled = this.tracking.isFeatureEnabled('manage-ontologies').pipe(shareReplay(1));
  isEntitiesEnabled = this.tracking.isFeatureEnabled('manage-entities').pipe(shareReplay(1));
  isUsersEnabled = this.tracking.isFeatureEnabled('manage-users').pipe(shareReplay(1));
  isWidgetsEnabled = this.tracking.isFeatureEnabled('manage-widgets').pipe(shareReplay(1));
  isAPIKeysEnabled = this.tracking.isFeatureEnabled('manage-api-keys').pipe(shareReplay(1));

  isAdmin = this.sdk.currentKb.pipe(map((kb) => !!kb.admin));
  isAdminOrContrib = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));

  constructor(
    private app: AppService,
    private dialog: MatDialog,
    private navigation: NavigationService,
    private tracking: STFTrackingService,
    private sdk: SDKService,
  ) {}

  ngOnInit(): void {
    this.sdk.currentKb.pipe(takeUntil(this.unsubscribeAll)).subscribe((kb) => {
      this.kbUrl = this.navigation.getKbUrl(kb.account, kb.slug!);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.isUnfolded) {
      this.app.setMenuOpen(this.isUnfolded);
    }
  }

  createNewLink() {
    this.dialog.open(CreateLinkComponent);
  }

  uploadNewFiles(folderMode: boolean) {
    this.dialog.open(UploadFilesDialogComponent, {
      data: { folderMode: folderMode },
    });
  }

  toggleQuickStart() {
    this.showQuickStart = !this.showQuickStart;
  }

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
