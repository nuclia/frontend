import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BackendConfigurationService, BillingService, injectScript } from '@flaps/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { WINDOW } from '@ng-web-apis/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AccountPageBase } from '../account-page-base';
import { AccountPageLayoutComponent } from '../account-page-layout/account-page-layout.component';

@Component({
  selector: 'app-account-billing',
  templateUrl: './account-billing.component.html',
  styleUrl: './account-billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountPageLayoutComponent, PaTabsModule, RouterLink, RouterLinkActive, AsyncPipe, TranslatePipe],
})
export class AccountBillingComponent extends AccountPageBase implements OnInit, OnDestroy {
  private readonly billing = inject(BillingService);
  private readonly window = inject(WINDOW);
  private readonly backendConfig = inject(BackendConfigurationService);

  protected isSubscribed = toSignal(this.billing.isSubscribedToStripe);
  protected isContextBoxActivation = toSignal(this.billing.isContextBoxActivation);
  protected isContextBoxPaymentRequired = toSignal(this.billing.isContextBoxPaymentRequired);
  noStripe = this.backendConfig.noStripe();

  protected title = computed(() => {
    if (this.isContextBoxActivation()) return 'billing.context-box.activation-title';
    return this.isSubscribed() ? 'billing.page-title' : 'billing.subscription.title';
  });
  protected description = computed(() => {
    if (this.isContextBoxActivation()) return 'billing.context-box.activation-description';
    return this.isSubscribed() ? 'billing.page-description' : 'billing.subscription.help';
  });

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
