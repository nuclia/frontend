import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, Inject } from '@angular/core';
import { injectScript } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class BillingComponent implements OnInit, OnDestroy {
  constructor(@Inject(WINDOW) private window: Window) {}

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
