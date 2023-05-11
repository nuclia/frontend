import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { combineLatest, map, merge, Observable, of, shareReplay, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AppService, NavigationService } from '../services';
import { SDKService, StateService, STFTrackingService } from '@flaps/core';
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

  isAdminOrContrib = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  isAdmin = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || kb.account === 'local'));
  account = this.stateService.account.pipe(filter((account) => !!account));
  kb = this.sdk.currentKb;
  accountUrl = this.account.pipe(map((account) => this.navigationService.getAccountManageUrl(account!.slug)));
  isAccountManager = this.account.pipe(map((account) => account!.can_manage_account));

  isActivityEnabled = this.tracking.isFeatureEnabled('view-activity').pipe(shareReplay(1));
  isEntitiesEnabled = this.tracking.isFeatureEnabled('manage-entities').pipe(shareReplay(1));
  isUsersEnabled = this.tracking.isFeatureEnabled('manage-users').pipe(shareReplay(1));
  isWidgetsEnabled = this.tracking.isFeatureEnabled('manage-widgets').pipe(shareReplay(1));
  isAPIKeysEnabled = this.tracking.isFeatureEnabled('manage-api-keys').pipe(shareReplay(1));
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));
  isTrainingEnabled = this.tracking.isFeatureEnabled('training').pipe(shareReplay(1));
  isSynonymsEnabled: Observable<boolean> = combineLatest([
    this.tracking.isFeatureEnabled('manage-synonyms').pipe(shareReplay(1)),
    this.account.pipe(
      filter((account) => !!account),
      map((account) => account?.type),
    ),
  ]).pipe(map(([featureEnabled, accountType]) => featureEnabled && accountType === 'stash-business'));

  standalone = this.sdk.nuclia.options.standalone;

  constructor(
    private app: AppService,
    private tracking: STFTrackingService,
    private sdk: SDKService,
    private stateService: StateService,
    private router: Router,
    private navigationService: NavigationService,
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
