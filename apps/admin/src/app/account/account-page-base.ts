import { AfterViewInit, DestroyRef, Directive, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountEntryContextService, NavigationService, SDKService } from '@flaps/core';
import { filter, fromEvent, of } from 'rxjs';

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
  protected entryContext = inject(AccountEntryContextService);

  protected readonly destroyRef = inject(DestroyRef);

  // `admin` has no KB/ARAG pages, so route back to the app the user actually entered from.
  backLink = of(this.entryContext.getReturnUrl());

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
