import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, Inject } from '@angular/core';
import { injectScript, NavigationService, SDKService } from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';
import { WINDOW } from '@ng-web-apis/common';
import { combineLatest, defer, filter, map, merge, of, shareReplay } from 'rxjs';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BillingComponent implements OnInit, OnDestroy {
  isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );
  kbUrl = this.navigation.kbUrl;
  backLink = this.navigation.kbUrl.pipe(map((url) => `${url}/simple`));
  private currentUrl = merge(
    defer(() => of(this.router.url)),
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => (event as NavigationEnd).urlAfterRedirects),
    ),
  );
  showBackToHome = combineLatest([this.isCowork, this.currentUrl]).pipe(
    map(([isCowork, url]) => isCowork && !url.includes('/billing/checkout')),
    shareReplay(1),
  );

  constructor(
    @Inject(WINDOW) private window: Window,
    private sdk: SDKService,
    private navigation: NavigationService,
    private router: Router,
  ) {}

  ngOnInit() {
    const hubSpotApi = (this.window as any)?.HubSpotConversations;
    if (hubSpotApi) {
      hubSpotApi.widget?.load();
    } else {
      injectScript('//js-eu1.hs-scripts.com/139773752.js').subscribe();
    }
  }

  ngOnDestroy() {
    (this.window as any)?.HubSpotConversations?.widget?.remove();
  }
}
