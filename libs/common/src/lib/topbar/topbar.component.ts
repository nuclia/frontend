import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BackendConfigurationService,
  FeatureFlagService,
  FeaturesService,
  NavigationService,
  NotificationService,
  SDKService,
  UserService,
} from '@flaps/core';
import { combineLatest, map, Observable, shareReplay, take } from 'rxjs';
import { StandaloneService } from '../services/standalone.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TopbarComponent {
  @Input({ transform: booleanAttribute }) isNotificationPanelOpen = false;
  @Output() toggleNotificationPanel = new EventEmitter<void>();

  userInfo = this.userService.userInfo;
  account = this.sdk.currentAccount;
  isStageOrDev = this.featureFlagService.isStageOrDev;
  private _account = this.sdk.currentAccount.pipe(shareReplay());
  accountType = this._account.pipe(map((account) => account.type));
  isAccountManager = this.features.isAccountManager;
  isTypeEnforced = combineLatest([this.accountType, this.route.queryParams.pipe(map((params) => params['type']))]).pipe(
    map(([currentType, nextType]) => nextType && currentType !== nextType),
  );
  shouldAccountTypeBeVisible = combineLatest([this.accountType, this.isTypeEnforced, this.isAccountManager]).pipe(
    map(
      ([accountType, isTypeEnforced, isAccountManager]) =>
        !!accountType && accountType !== 'v3enterprise' && !isTypeEnforced && isAccountManager,
    ),
  );
  billingUrl = this.sdk.currentAccount.pipe(
    map((account) => this.navigationService.getAccountManageUrl(account.slug) + '/billing'),
  );
  isTrial = this.features.isTrial;
  inPlatformApp = this.navigationService.inPlatformApp;
  inDashboard = this.navigationService.inDashboard;
  inArag = this.navigationService.inArag();
  showTrial = combineLatest([this.isTrial, this.accountType]).pipe(
    map(([isTrial, accountType]) => isTrial && accountType !== 'stash-trial'),
  );

  standalone = this.standaloneService.standalone;
  errorMessage = this.standaloneService.errorMessage;

  showDemo = !this.standalone;
  hasDemoButton = this.features.authorized.showDemoButton;
  notificationsCount: Observable<number> = this.notificationService.unreadNotificationsCount;

  private backendConfig = inject(BackendConfigurationService);
  logoPath = this.backendConfig.getLogoPath();
  brandName = this.backendConfig.getBrandName();
  simpleMode = this.navigationService.simpleMode;
  isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );
  hasSimpleUI = this.features.unstable.simpleUI;

  constructor(
    private router: Router,
    private userService: UserService,
    private navigationService: NavigationService,
    private sdk: SDKService,
    private route: ActivatedRoute,
    private standaloneService: StandaloneService,
    private notificationService: NotificationService,
    private features: FeaturesService,
    private featureFlagService: FeatureFlagService,
  ) {}

  goToHome(): void {
    combineLatest([
      this.isCowork.pipe(take(1)),
      this.navigationService.kbUrl.pipe(take(1)),
      this.navigationService.homeUrl.pipe(take(1)),
    ]).subscribe(([isCowork, kbUrl, homeUrl]) => {
      if (this.inDashboard && !isCowork) {
        // The logo should always take dashboard users back to the default (simple) home UI.
        this.navigationService.setSimpleMode(true);
        this.router.navigateByUrl(`${kbUrl}/simple`);
        return;
      }

      this.router.navigate([isCowork ? kbUrl : homeUrl]);
    });
  }

  bookDemo() {
    window.open('https://www.progress.com/agentic-rag/book-a-demo', 'blank', 'noreferrer');
  }

  goToTutorial() {
    window.open(
      'https://www.progress.com/agentic-rag/trial-guide?utm_medium=product&utm_source=trial-guide&utm_content=agentic-rag-trial',
      'blank',
      'noreferrer',
    );
  }

  switchMode(value: boolean) {
    this.navigationService.simpleMode.next(!value);
    this.navigationService.homeUrl.pipe(take(1)).subscribe((homeUrl) => {
      this.router.navigateByUrl(homeUrl);
    });
  }
}
