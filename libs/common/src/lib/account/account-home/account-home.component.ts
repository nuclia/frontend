import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { IKnowledgeBoxItem, UsagePoint, UsageType } from '@nuclia/core';
import {
  combineLatest,
  filter,
  forkJoin,
  map,
  ReplaySubject,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
} from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { MetricsService } from '../metrics.service';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { InviteCollaboratorsModalComponent } from '../invite-collaborators-modal';

@Component({
  selector: 'app-account-home',
  templateUrl: './account-home.component.html',
  styleUrls: ['./account-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedTab: 'consumption' | 'subscriptions' | 'users' | 'preferences' = 'consumption';
  unsubscribeAll = new Subject<void>();
  account$ = this.metrics.account$;
  isTrial = this.features.isTrial;
  totalQueries = this.metrics.getUsageCount(UsageType.SEARCHES_PERFORMED);
  selectedPeriod = new ReplaySubject<{ start: Date; end: Date }>(1);
  inRaoApp = this.navigation.inRaoApp;
  backLink = this.navigation.kbUrl.pipe(map((url) => `${url}/simple`));

  kbs = this.sdk.kbList;
  usage?: { [key: string]: UsagePoint[] };
  tokensCount?: { [key: string]: number };
  private sectionObserver?: IntersectionObserver;
  private readonly sectionTabs: Array<'consumption' | 'subscriptions' | 'users' | 'preferences'> = [
    'consumption',
    'subscriptions',
    'users',
    'preferences',
  ];

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private router: Router,
    private metrics: MetricsService,
    private route: ActivatedRoute,
    private modal: SisModalService,
    private features: FeaturesService,
  ) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(
        take(1),
        filter((params) => params['setup'] === 'invite-collaborators'),
        switchMap(() => this.route.params),
      )
      .subscribe((params) => {
        this.modal.openModal(
          InviteCollaboratorsModalComponent,
          new ModalConfig({ dismissable: false, data: { accountSlug: params['account'] } }),
        );
      });

    this.getUsageMap()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((usage) => {
        this.usage = usage;
        this.tokensCount = Object.entries(usage).reduce(
          (acc, [key, value]) => {
            acc[key] = value[0].metrics.find((metric) => metric.name === 'nuclia_tokens_billed')?.value || 0;
            return acc;
          },
          {} as { [key: string]: number },
        );
        this.cdr.markForCheck();
      });

    this.metrics.period.pipe(take(1)).subscribe((period) => {
      this.selectedPeriod.next(period);
    });
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  ngAfterViewInit(): void {
    this.initSectionObserver();
  }

  getUsageMap() {
    return combineLatest([this.account$, this.selectedPeriod, this.kbs]).pipe(
      switchMap(([account, period, kbs]) => {
        const requests = kbs
          .map((kb) =>
            this.sdk.nuclia.db
              .getUsage(account.id, period.start.toISOString(), period.end.toISOString(), kb.id)
              .pipe(map((usage) => ({ key: kb.id, usage }))),
          )
          .concat([
            this.sdk.nuclia.db
              .getUsage(account.id, period.start.toISOString(), period.end.toISOString())
              .pipe(map((usage) => ({ key: 'account', usage }))),
          ]);
        return forkJoin(requests);
      }),
      map((usage) =>
        usage.reduce(
          (acc, curr) => {
            acc[curr.key] = curr.usage;
            return acc;
          },
          {} as { [key: string]: UsagePoint[] },
        ),
      ),
      shareReplay(1),
    );
  }

  goToKb(account: string, kb: IKnowledgeBoxItem) {
    this.sdk.nuclia.options.zone = kb.zone;
    this.router.navigate([this.navigation.getKbUrl(account, kb.slug || '')]);
  }

  goToSection(section: 'consumption' | 'subscriptions' | 'users' | 'preferences') {
    this.selectedTab = section;
    this.cdr.markForCheck();
    const target = document.getElementById(`settings-${section}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private initSectionObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length === 0) {
          return;
        }

        const section = visible[0].target.id.replace('settings-', '') as
          | 'consumption'
          | 'subscriptions'
          | 'users'
          | 'preferences';

        if (this.selectedTab !== section) {
          this.selectedTab = section;
          this.cdr.markForCheck();
        }
      },
      {
        root: null,
        rootMargin: '-140px 0px -45% 0px',
        threshold: [0.2, 0.4, 0.6],
      },
    );

    this.sectionTabs.forEach((section) => {
      const element = document.getElementById(`settings-${section}`);
      if (element) {
        this.sectionObserver?.observe(element);
      }
    });
  }
}
