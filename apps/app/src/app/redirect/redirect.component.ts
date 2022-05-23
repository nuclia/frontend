import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/auth';
import { take } from 'rxjs';

@Component({
  template: 'Redirecting to Nuclia Desktop…',
})
export class RedirectComponent {
  constructor(private sdk: SDKService, private route: ActivatedRoute) {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      let redirectUrl: string = params['redirect'] || '';
      redirectUrl += redirectUrl.includes('?') ? '&' : '?';
      const tokens = `access_token=${this.sdk.nuclia.auth.getToken()}&refresh_token=${this.sdk.nuclia.auth.getRefreshToken()}`;
      location.href = redirectUrl + tokens;
    });
  }
}
