import { AfterViewInit, DestroyRef, Directive, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { combineLatest, filter, fromEvent, map, of, shareReplay, startWith, switchMap } from 'rxjs';

/**
 * Abstract base for account settings pages (home, administration, configuration).
 * Provides the shared back-link observable, sticky-nav resize fix, and lifecycle
 * teardown so each page only needs to declare its own feature flags.
 */
@Directive()
export abstract class AccountPageBase implements AfterViewInit {
  protected sdk = inject(SDKService);
  protected navigation = inject(NavigationService);
  protected route = inject(ActivatedRoute);
  protected router = inject(Router);

  protected readonly destroyRef = inject(DestroyRef);

  backLink = combineLatest([this.sdk.currentAccount, this.sdk.currentKb.pipe(startWith(null))]).pipe(
    switchMap(([account, kb]) => {
      if (!kb) {
        return of(this.navigation.getKbSelectUrl(account.slug));
      }
      // Both currentKb and aragList are ReplaySubjects — isArag emits synchronously
      // when aragList is already loaded (which it is whenever a KB/ARAG has been entered).
      return this.sdk.isArag.pipe(
        map((isArag) =>
          isArag
            ? this.navigation.getRetrievalAgentUrl(account.slug, kb.slug as string)
            : this.navigation.getKbUrl(account.slug, (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string),
        ),
      );
    }),
    shareReplay(1),
  );

  ngAfterViewInit(): void {
    // When navigating to this page via SPA (from a page that had the sidebar visible),
    // .dashboard-content width transitions over ~0.8s to full-width. pa-tabs captures
    // _xPosition in ngAfterContentInit (< 1 tick), which is mid-animation and therefore
    // wrong. Dispatching a resize event after the transition ends forces pa-tabs to
    // recapture the correct position.
    const content = document.querySelector('.dashboard-content');
    if (content) {
      fromEvent<TransitionEvent>(content, 'transitionend')
        .pipe(
          filter((e) => e.propertyName === 'width' && e.target === content),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => window.dispatchEvent(new Event('resize')));
    }
  }
}
