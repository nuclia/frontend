import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';
import { take } from 'rxjs';

const AUTHORIZED_REDIRECTS = ['nuclia-desktop://', 'http://localhost:4200'];

@Component({
  template: 'Redirecting to Nuclia Desktop…',
})
export class RedirectComponent {
  constructor(private sdk: SDKService, private route: ActivatedRoute) {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      let redirectUrl: string = params['redirect'] || '';
      if (!AUTHORIZED_REDIRECTS.includes(redirectUrl)) {
        console.warn('Redirect URL not authorized');
        return;
      }
      redirectUrl += redirectUrl.includes('?') ? '&' : '?';
      const tokens = `access_token=${this.sdk.nuclia.auth.getToken()}&refresh_token=${this.sdk.nuclia.auth.getRefreshToken()}`;
      location.href = redirectUrl + tokens;
    });
  }
}
