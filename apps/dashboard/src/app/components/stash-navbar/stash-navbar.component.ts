import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, animate, style, transition } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { Subject, map, shareReplay, of, merge } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AppService } from '../../services/app.service';
import { NavigationService } from '../../services/navigation.service';
import { CreateLinkComponent } from '../../upload/create-link/create-link.component';
import { UploadFilesDialogComponent } from '../../upload/upload-files/upload-files-dialog.component';
import { STFTrackingService, SDKService, StateService } from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';

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

  unsubscribeAll = new Subject<void>();
  inAccount = merge(
    of(this.navigationService.inAccountManagement(location.pathname)),
    this.router.events.pipe(
      takeUntil(this.unsubscribeAll),
      map(
        (event) =>
          event instanceof NavigationEnd && this.navigationService.inAccountManagement((event as NavigationEnd).url),
      ),
    ),
  );
  kbUrl: string = '';
  isUploadFolderEnabled = this.tracking.isFeatureEnabled('upload-folder').pipe(shareReplay(1));
  isActivityEnabled = this.tracking.isFeatureEnabled('view-activity').pipe(shareReplay(1));
  isOntologiesEnabled = this.tracking.isFeatureEnabled('manage-ontologies').pipe(shareReplay(1));
  isEntitiesEnabled = this.tracking.isFeatureEnabled('manage-entities').pipe(shareReplay(1));
  isUsersEnabled = this.tracking.isFeatureEnabled('manage-users').pipe(shareReplay(1));
  isWidgetsEnabled = this.tracking.isFeatureEnabled('manage-widgets').pipe(shareReplay(1));
  isAPIKeysEnabled = this.tracking.isFeatureEnabled('manage-api-keys').pipe(shareReplay(1));
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));
  isTrainingEnabled = this.tracking.isFeatureEnabled('training').pipe(shareReplay(1));

  isAdminOrContrib = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  account = this.stateService.account.pipe(filter((account) => !!account));
  kb = this.sdk.currentKb;
  accountUrl = this.account.pipe(map((account) => this.navigation.getAccountManageUrl(account!.slug)));
  isAccountManager = this.account.pipe(map((account) => account!.can_manage_account));

  constructor(
    private app: AppService,
    private dialog: MatDialog,
    private navigation: NavigationService,
    private tracking: STFTrackingService,
    private sdk: SDKService,
    private stateService: StateService,
    private router: Router,
    private navigationService: NavigationService,
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

  ngOnDestroy() {
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
