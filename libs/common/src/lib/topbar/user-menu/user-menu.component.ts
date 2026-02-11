import { CommonModule } from '@angular/common';
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
import { BackendConfigurationService, FeaturesService, NavigationService, SDKService } from '@flaps/core';
import {
  AvatarModel,
  PaAvatarModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Account, Welcome } from '@nuclia/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule, TranslateModule, PaIconModule, PaAvatarModule, PaDropdownModule, PaPopupModule],
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
  noStripe = this.backendConfig.noStripe();
  standalone = this.sdk.nuclia.options.standalone;

  private unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private navigation: NavigationService,
    private sdk: SDKService,
    private features: FeaturesService,
    private cdr: ChangeDetectorRef,
    private backendConfig: BackendConfigurationService,
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
    this.router.navigate(['/user-profile']);
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
    this.sdk.nuclia.auth.logout();
  }

  goToSupport() {
    location.href = 'mailto:Sales.AgenticRAG@progress.com';
  }

  goToManageAccount() {
    this.close.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/home']);
    }
  }
}
