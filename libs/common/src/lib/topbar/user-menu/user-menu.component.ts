import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AccountVerificationService,
  BackendConfigurationService,
  FeaturesService,
  NavigationService,
  SDKService,
} from '@flaps/core';
import {
  AvatarModel,
  PaAvatarModule,
  PaDropdownModule,
  PaFocusableModule,
  PaIconModule,
  PaPopupModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Account, Welcome } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { map, shareReplay, Subject, takeUntil } from 'rxjs';
import { AccountDeleteComponent } from '../../account/account-manage/account-delete/account-delete.component';

@Component({
  selector: 'app-user-menu',
  imports: [
    CommonModule,
    TranslateModule,
    PaIconModule,
    PaAvatarModule,
    PaDropdownModule,
    PaFocusableModule,
    PaPopupModule,
    AccountDeleteComponent,
  ],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit, OnDestroy {
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

  @Output() menuClose = new EventEmitter<void>();

  avatar: AvatarModel = {};
  accounts: string[] = [];
  account: Account | null = null;
  isAccountManager = this.features.isAccountManager;
  isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );
  isKbAdmin = this.features.isKbAdmin;
  isBillingEnabled = this.features.unstable.billing;
  isRetrievalAgentsEnabled = this.features.unstable.retrievalAgents;
  isModelManagementEnabled = this.features.unstable.modelManagement;
  noStripe = this.backendConfig.noStripe();
  standalone = this.sdk.nuclia.options.standalone;
  simpleMode = this.navigation.simpleMode;
  kbUrl = '';

  /** True when the Account group section has at least one visible item. */
  showAccountGroup = this.features.isAccountManager.pipe(
    map((isAccountManager) => !this.standalone && !!isAccountManager),
    shareReplay(1),
  );

  private unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private navigation: NavigationService,
    private sdk: SDKService,
    private features: FeaturesService,
    private cdr: ChangeDetectorRef,
    private backendConfig: BackendConfigurationService,
    private accountVerification: AccountVerificationService,
    private modalService: SisModalService,
  ) {
    this.sdk.currentAccount.pipe(takeUntil(this.unsubscribeAll)).subscribe((account) => {
      this.account = account;
      this.cdr.markForCheck();
    });
    this.navigation.kbUrl.pipe(takeUntil(this.unsubscribeAll)).subscribe((url) => {
      this.kbUrl = url;
    });
  }

  ngOnInit(): void {
    if (this.accountVerification.hasPendingDelete() && this.accountVerification.isRecentlyVerified()) {
      this.accountVerification.clearPendingDelete();
      this.modalService.openModal(AccountDeleteComponent);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goProfile() {
    this.menuClose.emit();
    // Account managers land in the shell; other users go to the standalone profile page
    // which does not require account-management access.
    if (this.account?.can_manage_account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/home'], {
        queryParams: { tab: 'preferences' },
      });
    } else {
      this.router.navigate(['/user/profile']);
    }
  }

  goToKnowledgeBoxes() {
    this.menuClose.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/administration'], {
        queryParams: { tab: 'knowledge-boxes' },
      });
    }
  }

  goToBilling() {
    this.menuClose.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/home'], {
        queryParams: { tab: 'subscriptions' },
      });
    }
  }

  switchAccount() {
    this.menuClose.emit();
    this.sdk.cleanAccount();
    this.router.navigate([this.navigation.getAccountSelectUrl()]);
  }

  logout() {
    this.menuClose.emit();
    this.sdk.nuclia.auth.logout();
  }

  goToSupport() {
    location.href = 'mailto:Sales.AgenticRAG@progress.com';
  }

  goToManageAccount() {
    this.menuClose.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/home'], {
        queryParams: { tab: 'consumption' },
      });
    }
  }

  goToAccountSettings() {
    this.menuClose.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/home'], {
        queryParams: { tab: 'account-settings' },
      });
    }
  }

  goToManageUsers() {
    this.menuClose.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/administration'], {
        queryParams: { tab: 'users' },
      });
    }
  }

  openDeleteAccount() {
    this.menuClose.emit();
    this.modalService.openModal(AccountDeleteComponent);
  }

  goToNuaKeys() {
    this.menuClose.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/configuration'], {
        queryParams: { tab: 'nua' },
      });
    }
  }

  goToRetrievalAgents() {
    this.menuClose.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/configuration'], {
        queryParams: { tab: 'retrieval-agents' },
      });
    }
  }

  goToModels() {
    this.menuClose.emit();
    if (this.account) {
      this.router.navigate([this.navigation.getAccountManageUrl(this.account.slug) + '/configuration'], {
        queryParams: { tab: 'models' },
      });
    }
  }
}
