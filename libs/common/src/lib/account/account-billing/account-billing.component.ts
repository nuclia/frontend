import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BackendConfigurationService, BillingService, FeaturesService, injectScript } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';
import { AccountPageBase } from '../account-page-base';

@Component({
  selector: 'app-account-billing',
  templateUrl: './account-billing.component.html',
  styleUrl: './account-billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AccountBillingComponent extends AccountPageBase implements OnInit, OnDestroy {
  private readonly billing = inject(BillingService);
  private readonly features = inject(FeaturesService);
  private readonly window = inject(WINDOW);
  private readonly backendConfig = inject(BackendConfigurationService);

  isSubscribed = this.billing.isSubscribedToStripe;
  isTrial = this.features.isTrial;
  noStripe = this.backendConfig.noStripe();

  ngOnInit(): void {
    const hubSpotApi = (this.window as any)?.HubSpotConversations;
    if (hubSpotApi) {
      hubSpotApi.widget?.load();
    } else {
      injectScript('//js-eu1.hs-scripts.com/139773752.js').subscribe();
    }
  }

  ngOnDestroy(): void {
    (this.window as any)?.HubSpotConversations?.widget?.remove();
  }
}
