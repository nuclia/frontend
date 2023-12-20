import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, Inject } from '@angular/core';
import { injectScript } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent implements OnInit, OnDestroy {
  constructor(@Inject(WINDOW) private window: Window) {}

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
