import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { combineLatest, filter, fromEvent, map, shareReplay, startWith, Subject, takeUntil } from 'rxjs';

type AdministrationTab = 'knowledge-boxes' | 'users' | 'retrieval-agents';

@Component({
  selector: 'app-account-administration',
  templateUrl: './account-administration.component.html',
  styleUrl: './account-administration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountAdministrationComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedTab: AdministrationTab = 'knowledge-boxes';
  knowledgeBoxesAction: 'create' | null = null;
  unsubscribeAll = new Subject<void>();

  isAccountManager = this.features.isAccountManager;
  isRetrievalAgentsEnabled = this.features.unstable.retrievalAgents;

  backLink = combineLatest([
    this.sdk.currentAccount,
    this.sdk.currentKb.pipe(startWith(null)),
  ]).pipe(
    map(([account, kb]) => {
      const kbSlug = kb && (this.sdk.nuclia.options.standalone ? kb.id : kb.slug);
      return kbSlug
        ? this.navigation.getKbUrl(account.slug, kbSlug as string)
        : this.navigation.getKbSelectUrl(account.slug);
    }),
    shareReplay(1),
  );

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private features: FeaturesService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    combineLatest([this.route.queryParams, this.isRetrievalAgentsEnabled])
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(([params, retrievalAgentsEnabled]) => {
      const tab = params['tab'] as AdministrationTab;
      const action = params['action'] as string | undefined;
      const validTabs: AdministrationTab[] = ['knowledge-boxes', 'users'];
      if (retrievalAgentsEnabled) {
        validTabs.push('retrieval-agents');
      }
      if (tab && validTabs.includes(tab)) {
        this.selectedTab = tab;
      } else {
        this.selectedTab = 'knowledge-boxes';
      }
      this.knowledgeBoxesAction = this.selectedTab === 'knowledge-boxes' && action === 'create' ? 'create' : null;
      this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    const content = document.querySelector('.dashboard-content');
    if (content) {
      fromEvent<TransitionEvent>(content, 'transitionend')
        .pipe(
          filter((e) => e.propertyName === 'width' && e.target === content),
          takeUntil(this.unsubscribeAll),
        )
        .subscribe(() => window.dispatchEvent(new Event('resize')));
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goToSection(section: AdministrationTab) {
    this.selectedTab = section;
    this.knowledgeBoxesAction = null;
    this.cdr.markForCheck();
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: section } });
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
  }
}