import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, Inject } from '@angular/core';
import { injectScript, NavigationService, SDKService } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';
import { map, shareReplay } from 'rxjs';

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

  constructor(
    @Inject(WINDOW) private window: Window,
    private sdk: SDKService,
    private navigation: NavigationService,
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
