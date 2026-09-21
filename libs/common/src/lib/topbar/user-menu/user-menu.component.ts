import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import {
  AccountVerificationService,
  BackendConfigurationService,
  BillingService,
  FeaturesService,
  NavigationService,
  NotificationService,
  SDKService,
} from '@flaps/core';
import {
  AvatarModel,
  PaAvatarModule,
  PaDropdownModule,
  PaFocusableModule,
  PaPopupModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Welcome } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, switchMap, take } from 'rxjs';
import { AccountDeleteComponent } from '../../account/account-manage/account-delete/account-delete.component';

interface MenuItem {
  label: string;
  icon: string;
  action: () => void;
  visible$?: Observable<boolean>;
  count$?: Observable<number>;
  dataCy?: string;
  destructive?: boolean;
}

interface MenuSection {
  header?: string;
  headerText$?: Observable<string>;
  items: MenuItem[];
  visible$?: Observable<boolean>;
  prependSeparator?: boolean;
  appendSeparator?: boolean;
}

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule, TranslateModule, PaAvatarModule, PaDropdownModule, PaFocusableModule, PaPopupModule],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly navigation = inject(NavigationService);
  private readonly sdk = inject(SDKService);
  private readonly features = inject(FeaturesService);
  private readonly backendConfig = inject(BackendConfigurationService);
  private readonly accountVerification = inject(AccountVerificationService);
  private readonly modalService = inject(SisModalService);
  private readonly billing = inject(BillingService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  @Input() set userInfo(userInfo: Welcome | undefined | null) {
    if (userInfo) {
      this.accounts = userInfo.accounts || [];
      this.showSwitchAccount$.next(this.accounts.length > 1 || !!this.standalone);
      if (userInfo.preferences) {
        this.avatar = {
          userName: userInfo.preferences.name,
          userId: userInfo.preferences.email,
        };
      }
    }
  }

  @Output() menuClose = new EventEmitter<void>();
  @Output() openNotifications = new EventEmitter<void>();

  avatar: AvatarModel = {};
  accounts: string[] = [];

  readonly accountTitle$ = this.sdk.currentAccount.pipe(
    map((account) => account.title),
    shareReplay(1),
  );

  readonly unreadCount$ = this.notificationService.unreadNotificationsCount;
  readonly hasUnread$ = this.unreadCount$.pipe(
    map((count) => count > 0),
    shareReplay(1),
  );

  // The unread dot is aria-hidden, so the count has to reach assistive tech via the
  // trigger's own label.
  readonly menuAriaLabel$ = this.unreadCount$.pipe(
    switchMap((count) =>
      count > 0
        ? this.translate.get('generic.user_menu_with_notifications', { count })
        : this.translate.get('generic.user_menu'),
    ),
  );

  private readonly standalone = this.sdk.nuclia.options.standalone;
  private readonly noStripe = this.backendConfig.noStripe();

  private readonly isAccountManager = this.features.isAccountManager;
  private readonly isBillingEnabled = this.features.unstable.billing;
  private readonly isRetrievalAgentsEnabled = this.features.unstable.retrievalAgents;
  private readonly isModelManagementEnabled = this.features.unstable.modelManagement;

  private readonly isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );

  private readonly simpleMode = this.navigation.simpleMode;

  private readonly isKbAdmin = this.features.isKbAdmin;

  private readonly showAccountGroup = this.isAccountManager.pipe(
    map((isAccountManager) => !this.standalone && !!isAccountManager),
    shareReplay(1),
  );

  // True in advanced (non-simple) mode AND user has account-level access
  private readonly showAdvancedAccountSections = combineLatest([
    this.simpleMode.pipe(map((s) => !s)),
    this.showAccountGroup,
  ]).pipe(
    map(([advanced, group]) => advanced && group),
    shareReplay(1),
  );

  private readonly showSwitchAccount$ = new BehaviorSubject<boolean>(!!this.standalone);

  private readonly showBillingGroup = combineLatest([this.isAccountManager, this.billing.isSubscribedToStripe]).pipe(
    map(([manager, subscribed]) => !this.standalone && !!manager && (subscribed || !this.noStripe)),
    shareReplay(1),
  );

  private readonly showBillingPlansItem = this.isBillingEnabled.pipe(
    map((billing) => !!billing && !this.noStripe),
    shareReplay(1),
  );

  private readonly isSubscribedToStripe = this.billing.isSubscribedToStripe;

  readonly sections: MenuSection[] = [
    // ── Account ────────────────────────────────────────────────────────────
    // The header shows the current account name and is always rendered so every
    // user can tell which account they are in; the items below stay gated.
    {
      headerText$: this.accountTitle$,
      items: [
        {
          label: 'notification.panel.title',
          icon: 'bell',
          dataCy: 'open-notifications',
          action: () => this.showNotifications(),
          count$: this.unreadCount$,
          visible$: this.simpleMode.pipe(map((simple) => !simple)),
        },
        {
          label: 'account.consumption',
          icon: 'chart',
          dataCy: 'go-to-consumption',
          action: () => this.go('home/consumption'),
          visible$: this.isAccountManager.pipe(map((m) => !this.standalone && !!m)),
        },
        {
          label: 'account.manage',
          icon: 'gear',
          dataCy: 'go-to-account-settings',
          action: () => this.go('home/account-settings'),
          visible$: combineLatest([this.isAccountManager, this.isCowork]).pipe(
            map(([manager, cowork]) => !this.standalone && !!manager && !cowork),
          ),
        },
      ],
    },
    // ── User preferences — visible for all users in all modes ─────────────
    {
      items: [
        {
          label: 'generic.user_preferences',
          icon: 'user',
          dataCy: 'go-to-user-preferences',
          action: () => this.navigateToProfile(),
        },
        {
          label: 'api-key-management.title',
          icon: 'key',
          dataCy: 'go-to-api-keys',
          action: () => this.go('home/api-keys'),
          visible$: combineLatest([this.isAccountManager, this.isCowork]).pipe(
            map(([manager, cowork]) => !!manager && !!cowork),
          ),
        },
      ],
    },
    // ── Billing ────────────────────────────────────────────────────────────
    {
      header: 'user-menu.section.billing',
      visible$: this.showBillingGroup,
      items: [
        {
          // Always shown when billing is enabled + Stripe available
          label: 'billing.plan-subscription',
          icon: 'payment',
          dataCy: 'go-to-billing',
          action: () => this.go('billing'),
          visible$: this.showBillingPlansItem,
        },
        {
          label: 'billing.usage.label',
          icon: 'activity-log',
          dataCy: 'go-to-usage',
          action: () => this.go('billing/usage'),
          visible$: this.isSubscribedToStripe,
        },
        {
          label: 'billing.payment_details',
          icon: 'payment-details',
          dataCy: 'go-to-checkout',
          action: () => this.go('billing/checkout'),
          visible$: this.isSubscribedToStripe,
        },
        {
          label: 'billing.my-subscription',
          icon: 'info',
          dataCy: 'go-to-my-subscription',
          action: () => this.go('billing/my-subscription'),
          visible$: this.isSubscribedToStripe,
        },
        {
          label: 'billing.history.link',
          icon: 'history',
          dataCy: 'go-to-history',
          action: () => this.go('billing/history'),
          visible$: this.isSubscribedToStripe,
        },
      ],
    },
    // ── Administration ─────────────────────────────────────────────────────
    {
      header: 'user-menu.section.administration',
      visible$: this.showAdvancedAccountSections,
      prependSeparator: true,
      items: [
        {
          label: 'account.related_kbs',
          icon: 'knowledge-box',
          dataCy: 'go-to-account-kbs',
          action: () => this.go('administration/knowledge-boxes'),
        },
        {
          label: 'navbar.account-retrieval-agents',
          icon: 'workflows',
          dataCy: 'go-to-retrieval-agents',
          action: () => this.go('administration/retrieval-agents'),
          visible$: this.isRetrievalAgentsEnabled,
        },
        {
          label: 'account.manage_users',
          icon: 'users',
          dataCy: 'go-to-manage-users',
          action: () => this.go('administration/users'),
          visible$: this.isAccountManager,
        },
      ],
    },
    // ── Context box administration ─────────────────────────────────────────────────────
    {
      header: 'user-menu.section.administration',
      visible$: combineLatest([this.isCowork, this.isKbAdmin]).pipe(map(([cowork, kbAdmin]) => !!cowork && !!kbAdmin)),
      prependSeparator: true,
      items: [
        {
          label: 'account.manage_users',
          icon: 'users',
          dataCy: 'go-to-manage-users',
          action: () => this.navigateToKbUsers(),
        },
      ],
    },
    // ── Configuration ──────────────────────────────────────────────────────
    {
      header: 'user-menu.section.configuration',
      visible$: this.showAdvancedAccountSections,
      prependSeparator: true,
      items: [
        {
          label: 'navbar.nua-keys',
          icon: 'key',
          dataCy: 'go-to-nua-keys',
          action: () => this.go('configuration/nua'),
        },
        {
          label: 'navbar.models',
          icon: 'settings',
          dataCy: 'go-to-models',
          action: () => this.go('configuration/models'),
          visible$: this.isModelManagementEnabled,
        },
      ],
    },
    // ── Support ────────────────────────────────────────────────────────────
    {
      header: 'user-menu.section.support',
      items: [
        {
          label: 'generic.report_bug',
          icon: 'warning',
          // intentionally no menuClose — mailto opens externally, page stays
          action: () => {
            location.href = 'mailto:Sales.AgenticRAG@progress.com';
          },
        },
        {
          label: 'account.delete_account',
          icon: 'trash',
          dataCy: 'delete-account',
          destructive: true,
          action: () => this.openDeleteAccount(),
          visible$: combineLatest([this.simpleMode, this.isAccountManager]).pipe(
            map(([simple, manager]) => !!simple && !!manager),
          ),
        },
      ],
    },
    // ── Session ────────────────────────────────────────────────────────────
    {
      prependSeparator: true,
      items: [
        {
          label: 'generic.switch_account',
          icon: 'reload',
          action: () => this.switchAccount(),
          visible$: this.showSwitchAccount$,
        },
        {
          label: 'generic.logout',
          icon: 'log-out',
          dataCy: 'logout',
          action: () => this.logout(),
        },
      ],
    },
  ];

  ngOnInit(): void {
    if (this.accountVerification.hasPendingDelete() && this.accountVerification.isRecentlyVerified()) {
      this.accountVerification.clearPendingDelete();
      this.modalService.openModal(AccountDeleteComponent);
    }
  }

  private showNotifications(): void {
    this.menuClose.emit();
    this.openNotifications.emit();
  }

  private go(path: string): void {
    this.menuClose.emit();
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      this.navigation.navigateExternal(`${this.navigation.getAccountManageUrl(account.slug)}/${path}`, {
        withFromApp: true,
      });
    });
  }

  // Account managers navigate to the preferences tab; other users go to the standalone profile page.
  private navigateToProfile(): void {
    this.menuClose.emit();
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      if (account.can_manage_account) {
        this.navigation.navigateExternal(`${this.navigation.getAccountManageUrl(account.slug)}/home/preferences`, {
          withFromApp: true,
        });
      } else {
        this.router.navigate(['/user/profile']);
      }
    });
  }

  private navigateToKbUsers() {
    this.menuClose.emit();
    this.navigation.kbUrl.pipe(take(1)).subscribe((kbUrl) => {
      this.router.navigate([kbUrl + '/users']);
    });
  }

  private switchAccount(): void {
    this.menuClose.emit();
    this.sdk.cleanAccount();
    this.router.navigate([this.navigation.getAccountSelectUrl()]);
  }

  private openDeleteAccount(): void {
    this.menuClose.emit();
    this.modalService.openModal(AccountDeleteComponent);
  }

  private logout(): void {
    this.menuClose.emit();
    this.sdk.nuclia.auth.logout();
  }
}
