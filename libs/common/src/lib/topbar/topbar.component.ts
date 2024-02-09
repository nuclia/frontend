import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService, NotificationService, SDKService, UserService } from '@flaps/core';
import { combineLatest, map, Observable, shareReplay, take } from 'rxjs';
import { StandaloneService } from '../services/standalone.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  @Input({ transform: booleanAttribute }) isNotificationPanelOpen = false;
  @Output() toggleNotificationPanel = new EventEmitter<void>();

  userInfo = this.userService.userInfo;
  account = this.sdk.currentAccount;
  kb = this.sdk.currentKb;
  isStage = location.hostname === 'stashify.cloud';
  private _account = this.sdk.currentAccount.pipe(shareReplay());
  accountType = this._account.pipe(map((account) => account.type));
  isAccountManager = this._account.pipe(map((account) => account.can_manage_account));
  isTypeEnforced = combineLatest([this.accountType, this.route.queryParams.pipe(map((params) => params['type']))]).pipe(
    map(([currentType, nextType]) => nextType && currentType !== nextType),
  );
  shouldAccountTypeBeVisible = combineLatest([this.accountType, this.isTypeEnforced, this.isAccountManager]).pipe(
    map(
      ([accountType, isTypeEnforced, isAccountManager]) =>
        !!accountType &&
        accountType !== 'stash-enterprise' &&
        accountType !== 'v3enterprise' &&
        !isTypeEnforced &&
        isAccountManager,
    ),
  );
  billingUrl = this.sdk.currentAccount.pipe(
    map((account) => this.navigationService.getAccountManageUrl(account.slug) + '/billing'),
  );

  standalone = this.standaloneService.standalone;
  errorMessage = this.standaloneService.errorMessage;

  showDemo = !this.standalone;
  notificationsCount: Observable<number> = this.notificationService.unreadNotificationsCount;

  constructor(
    private router: Router,
    private userService: UserService,
    private navigationService: NavigationService,
    private sdk: SDKService,
    private route: ActivatedRoute,
    private standaloneService: StandaloneService,
    private notificationService: NotificationService,
  ) {}

  goToHome(): void {
    this.navigationService.homeUrl.pipe(take(1)).subscribe((url) => {
      this.router.navigate([url]);
    });
  }

  bookDemo() {
    window.open('https://calendly.com/nuclia/30min?back=1&month=2023-10', 'blank', 'noreferrer');
  }
}
