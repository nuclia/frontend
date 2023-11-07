import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { map, merge, Observable, of, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { NavigationService, StandaloneService } from '../services';
import { SDKService, STFTrackingService } from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';
import { SmallNavbarDirective } from './small-navbar.directive';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate('150ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class NavbarComponent extends SmallNavbarDirective implements OnInit, OnDestroy {
  @Input() isUnfolded: boolean = false;

  unsubscribeAll = new Subject<void>();
  inAccount: Observable<boolean> = merge(
    of(this.navigationService.inAccountManagement(location.pathname)),
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => this.navigationService.inAccountManagement((event as NavigationEnd).url)),
      takeUntil(this.unsubscribeAll),
    ),
  );
  kbUrl: string = '';

  isAdminOrContrib = this.sdk.isAdminOrContrib;
  isAdmin = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || kb.account === 'local'));
  account = this.sdk.currentAccount;
  isTrial = this.account.pipe(map((account) => account?.type === 'stash-trial'));
  kb = this.sdk.currentKb;
  accountUrl = this.account.pipe(map((account) => this.navigationService.getAccountManageUrl(account!.slug)));
  isAccountManager = this.account.pipe(map((account) => account!.can_manage_account));

  isEntitiesEnabled = this.tracking.isFeatureEnabled('manage-entities');
  isBillingEnabled = this.tracking.isFeatureEnabled('billing');
  isTrainingEnabled = this.tracking.isFeatureEnabled('training');
  isSynonymsEnabled: Observable<boolean> = this.account
    .pipe(
      filter((account) => !!account),
      map((account) => account?.type),
    )
    .pipe(
      map(
        (accountType) => !!accountType && ['stash-growth', 'stash-startup', 'stash-enterprise'].includes(accountType),
      ),
    );

  standalone = this.sdk.nuclia.options.standalone;
  invalidKey = this.standaloneService.hasValidKey.pipe(map((hasValidKey) => this.standalone && !hasValidKey));

  constructor(
    private tracking: STFTrackingService,
    private sdk: SDKService,
    private router: Router,
    private navigationService: NavigationService,
    private standaloneService: StandaloneService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.sdk.currentKb.pipe(takeUntil(this.unsubscribeAll)).subscribe((kb) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      this.kbUrl = this.navigationService.getKbUrl(kb.account, kbSlug);
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    if (this.unsubscribeAll) {
      this.unsubscribeAll.next();
      this.unsubscribeAll.complete();
    }
  }
}
