import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { combineLatest, filter, fromEvent, map, shareReplay, startWith, Subject, takeUntil } from 'rxjs';

type ConfigurationTab = 'nua' | 'retrieval-agents' | 'models';

@Component({
  selector: 'app-account-configuration',
  templateUrl: './account-configuration.component.html',
  styleUrl: './account-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountConfigurationComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedTab: ConfigurationTab = 'nua';
  unsubscribeAll = new Subject<void>();

  isAccountManager = this.features.isAccountManager;
  isRetrievalAgentsEnabled = this.features.unstable.retrievalAgents;
  isModelManagementEnabled = this.features.unstable.modelManagement;

  // Compute the back-link target from the active KB. When no KB is in context
  // (e.g. the user loaded manage/configuration directly), fall back to the KB-select page
  // for this account so clicking "Back" always lands somewhere meaningful.
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
    // Listen to query params for the lifetime of the component so that
    // re-navigating to a different tab from the dropdown (while already on the
    // shell) correctly updates the selected tab.
    this.route.queryParams.pipe(takeUntil(this.unsubscribeAll)).subscribe((params) => {
      const tab = params['tab'] as ConfigurationTab;
      const validTabs: ConfigurationTab[] = ['nua', 'retrieval-agents', 'models'];
      if (tab && validTabs.includes(tab)) {
        this.selectedTab = tab;
        this.cdr.markForCheck();
      } else if (!tab) {
        // No tab param — default to nua.
        this.selectedTab = 'nua';
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit(): void {
    // When navigating to configuration via SPA (from a page that had the sidebar
    // visible), the .dashboard-content width transitions over ~0.8s to full-width.
    // pa-tabs captures _xPosition in ngAfterContentInit (< 1 tick), which is
    // mid-animation and therefore wrong.  Dispatching a resize event after the
    // transition ends forces pa-tabs to recapture the correct position.
    const content = document.querySelector('.dashboard-content');
    if (content) {
      fromEvent<TransitionEvent>(content, 'transitionend')
        .pipe(
          // Guard against bubbled transitionend events from child elements — only
          // react when the .dashboard-content element itself finishes its width animation.
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

  goToSection(section: ConfigurationTab) {
    this.selectedTab = section;
    this.cdr.markForCheck();
    // Update query params to reflect selected tab
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: section } });
    // pa-tabs._xPosition can go stale when the new tab's content causes a
    // micro layout shift (e.g. embedded component loading its data).  Dispatching
    // resize after Angular has rendered the new content forces pa-tabs to
    // recapture _xPosition and reposition the slider correctly.
    setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
  }
}
