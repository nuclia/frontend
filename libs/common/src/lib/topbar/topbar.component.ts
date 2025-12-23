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
import { combineLatest, map, Observable, shareReplay, switchMap, take } from 'rxjs';
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
  showTrial = combineLatest([this.features.isTrial, this.accountType]).pipe(
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
    this.navigationService.homeUrl.pipe(take(1)).subscribe((url) => {
      this.router.navigate([url]);
    });
  }

  bookDemo() {
    window.open('https://nuclia.com/book-a-demo/', 'blank', 'noreferrer');
  }
}
