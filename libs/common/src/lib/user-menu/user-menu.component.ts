import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { SDKService, StateService, STFTrackingService, UserService } from '@flaps/core';
import { Account, Welcome } from '@nuclia/core';
import { map, shareReplay, Subject, takeUntil } from 'rxjs';
import { AvatarModel } from '@guillotinaweb/pastanaga-angular';
import { NavigationService } from '../services';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnDestroy {
  @Input() set userInfo(userInfo: Welcome | undefined | null) {
    if (userInfo) {
      this.accounts = userInfo.accounts || [];
      if (userInfo.preferences) {
        this.avatar = {
          userName: userInfo.preferences.name,
          userId: userInfo.preferences.email,
        };
      }
    }
  }

  @Output() close = new EventEmitter<void>();

  avatar: AvatarModel = {};
  accounts: string[] = [];
  account: Account | null = null;
  isAccountManager = this.sdk.currentAccount.pipe(map((account) => account!.can_manage_account));
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));
  hasOwnAccount = this.userService.hasOwnAccount;
  standalone = this.sdk.nuclia.options.standalone;

  private unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private stateService: StateService,
    private navigation: NavigationService,
    private userService: UserService,
    private sdk: SDKService,
    private tracking: STFTrackingService,
    private cdr: ChangeDetectorRef,
  ) {
    this.stateService.account.pipe(takeUntil(this.unsubscribeAll)).subscribe((account) => {
      this.account = account;
      this.cdr?.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goProfile() {
    this.close.emit();
    this.router.navigate(['/user/profile']);
  }

  goToBilling() {
    this.close.emit();
    this.router.navigate([`${this.navigation.getAccountManageUrl(this.account?.slug || '')}/billing`]);
  }

  switchAccount() {
    this.close.emit();
    this.stateService.cleanAccount();
    this.router.navigate([this.navigation.getAccountSelectUrl()]);
  }

  logout() {
    this.close.emit();
    this.router.navigate(['/user/logout']);
  }

  goToSupport() {
    window.open('https://github.com/nuclia/support', '_blank', 'noopener,noreferrer');
  }

  createAccount() {
    this.close.emit();
    this.router.navigate(['/user/onboarding']);
  }
}
