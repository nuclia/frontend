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
import { combineLatest, map, Observable, of, shareReplay, switchMap, take } from 'rxjs';
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
  brandName = this.backendConfig.getBrandName();
  simpleMode = this.navigationService.simpleMode;
  isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );
  logoPath = this.isCowork.pipe(
    map((isCowork) => {
      if (isCowork) {
        return 'assets/logos/logo-context-box.svg';
      } else if (this.standalone) {
        return 'assets/logos/nucliadb.svg';
      } else {
        return this.backendConfig.getLogoPath();
      }
    }),
  );

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
    // When in account management use the same logic as the "Back to homepage"
    // button in AccountSettingsComponent: resolve from currentKb (startWith null
    // so we always get one emission even if no KB is in context).
    if (this.navigationService.inAccountManagement(location.pathname)) {
      this.sdk.currentAccount
        .pipe(
          take(1),
          switchMap((account) => {
            if (!this.sdk.isKbLoaded) {
              return of(this.navigationService.getKbSelectUrl(account.slug));
            }
            // currentKb and aragList are both in ReplaySubjects already — isArag emits synchronously
            return combineLatest([this.sdk.currentKb, this.sdk.isArag]).pipe(
              take(1),
              map(([kb, isArag]) =>
                isArag
                  ? this.navigationService.getRetrievalAgentUrl(account.slug, kb.slug as string)
                  : this.navigationService.getKbUrl(
                      account.slug,
                      (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string,
                    ),
              ),
            );
          }),
        )
        .subscribe((url) => this.router.navigate([url]));
      return;
    }

    const simpleHomeUrl$ = this.sdk.isKbLoaded
      ? this.navigationService.kbUrl
      : of(this.navigationService.getAccountSelectUrl());

    this.simpleMode
      .pipe(
        take(1),
        switchMap((simpleMode) => (simpleMode ? simpleHomeUrl$ : this.navigationService.homeUrl)),
        take(1),
      )
      .subscribe((url) => this.router.navigate([url]));
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

  goToSubscriptions() {
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      this.router.navigate([`${this.navigationService.getAccountManageUrl(account.slug)}/home/subscriptions`]);
    });
  }
}
