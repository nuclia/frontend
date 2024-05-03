import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Router, RouterLinkActive } from '@angular/router';
import { FeaturesService, NavigationService, SDKService, UserService } from '@flaps/core';
import { Account, Welcome } from '@nuclia/core';
import { Subject, takeUntil } from 'rxjs';
import {
  AvatarModel,
  PaAvatarModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
} from '@guillotinaweb/pastanaga-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    PaIconModule,
    PaAvatarModule,
    PaDropdownModule,
    PaPopupModule,
    RouterLinkActive,
  ],
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
  isAccountManager = this.features.isAccountManager;
  isBillingEnabled = this.features.unstable.billing;
  hasOwnAccount = this.userService.hasOwnAccount;
  standalone = this.sdk.nuclia.options.standalone;

  private unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private navigation: NavigationService,
    private userService: UserService,
    private sdk: SDKService,
    private features: FeaturesService,
    private cdr: ChangeDetectorRef,
  ) {
    this.sdk.currentAccount.pipe(takeUntil(this.unsubscribeAll)).subscribe((account) => {
      this.account = account;
      this.cdr.markForCheck();
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
    this.sdk.cleanAccount();
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

  goToManageAccount() {
    this.close.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/home']);
    }
  }
}
