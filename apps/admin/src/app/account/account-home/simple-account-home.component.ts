import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MetricsService, ProfileComponent } from '@flaps/common';
import { AccountEntryContextService, FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { UsagePoint } from '@nuclia/core';
import { BackButtonComponent } from '@nuclia/sistema';
import { combineLatest, map, of, ReplaySubject, shareReplay, Subject, switchMap, take, takeUntil } from 'rxjs';
import { AccountUsersComponent } from '../account-users/account-users.component';
import { SubscriptionsComponent } from '../billing/subscriptions/subscriptions.component';
import { NucliaTokensComponent } from '../nuclia-tokens/nuclia-tokens.component';

@Component({
  selector: 'app-simple-account-home',
  templateUrl: './simple-account-home.component.html',
  styleUrl: './simple-account-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BackButtonComponent,
    PaTabsModule,
    NucliaTokensComponent,
    SubscriptionsComponent,
    AccountUsersComponent,
    ProfileComponent,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class SimpleAccountHomeComponent implements OnInit, OnDestroy {
  selectedTab: 'consumption' | 'subscriptions' | 'users' | 'preferences' = 'consumption';
  unsubscribeAll = new Subject<void>();
  account$ = this.metrics.account$;
  selectedPeriod = new ReplaySubject<{ start: Date; end: Date }>(1);
  inRaoApp = this.navigation.inRaoApp;
  // `admin` has no KB pages — go back to whichever app the user entered from.
  backLink = of(this.entryContext.getReturnUrl());

  usage?: { [key: string]: UsagePoint[] };

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private metrics: MetricsService,
    private features: FeaturesService,
    private route: ActivatedRoute,
    private entryContext: AccountEntryContextService,
  ) {}

  ngOnInit() {
    this.getUsageMap()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((usage) => {
        this.usage = usage;
        this.cdr.markForCheck();
      });

    this.metrics.period.pipe(take(1)).subscribe((period) => {
      this.selectedPeriod.next(period);
    });

    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      const tab = params['tab'];
      if (tab && ['consumption', 'subscriptions', 'users', 'preferences'].includes(tab)) {
        this.selectedTab = tab as typeof this.selectedTab;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  getUsageMap() {
    return combineLatest([this.account$, this.selectedPeriod]).pipe(
      switchMap(([account, period]) =>
        this.sdk.nuclia.db
          .getUsage(account.id, period.start.toISOString(), period.end.toISOString())
          .pipe(map((usage) => ({ account: usage }))),
      ),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  goToSection(section: 'consumption' | 'subscriptions' | 'users' | 'preferences') {
    this.selectedTab = section;
    this.cdr.markForCheck();
  }
}
