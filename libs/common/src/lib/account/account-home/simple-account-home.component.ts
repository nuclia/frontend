import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { UsagePoint } from '@nuclia/core';
import { combineLatest, map, ReplaySubject, shareReplay, Subject, switchMap, take, takeUntil } from 'rxjs';
import { MetricsService } from '../metrics.service';

@Component({
  selector: 'app-simple-account-home',
  templateUrl: './simple-account-home.component.html',
  styleUrl: './simple-account-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SimpleAccountHomeComponent implements OnInit, OnDestroy {
  selectedTab: 'consumption' | 'subscriptions' | 'users' | 'preferences' = 'consumption';
  unsubscribeAll = new Subject<void>();
  account$ = this.metrics.account$;
  isTrial = this.features.isTrial;
  selectedPeriod = new ReplaySubject<{ start: Date; end: Date }>(1);
  inRaoApp = this.navigation.inRaoApp;
  backLink = this.navigation.kbUrl.pipe(map((url) => `${url}/simple`));

  usage?: { [key: string]: UsagePoint[] };

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private metrics: MetricsService,
    private features: FeaturesService,
    private route: ActivatedRoute,
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
