import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, Inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { injectScript, SDKService } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent implements OnInit, OnDestroy {
  isSubscribed = this.sdk.currentAccount.pipe(
    map((account) => account.type !== 'stash-basic' && account.type !== 'stash-trial'),
  );
  isCheckoutActive = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => this.router.url.includes('checkout')),
  );

  constructor(private router: Router, private sdk: SDKService, @Inject(WINDOW) private window: Window) {}

  ngOnInit() {
    const tidioApi = (this.window as any)?.tidioChatApi;
    if (tidioApi) {
      tidioApi.show();
    } else {
      injectScript('//code.tidio.co/kynayco5sfwolxr9cjmy639y9ez12wrs.js').subscribe();
    }
  }

  ngOnDestroy() {
    (this.window as any)?.tidioChatApi?.hide();
  }
}
