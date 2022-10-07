import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService, UserService } from '@flaps/core';
import { take, map, filter, switchMap, combineLatest } from 'rxjs';

const AUTHORIZED_REDIRECTS = ['nuclia-desktop://', 'http://localhost:4200'];
const AUTHORIZED_REDIRECTS_REGEX = [/^chrome\-extension\:\/\/[a-z]+\/options\/options\.html$/];

@Component({
  template: '{{ fromChromeExtension ?  "Redirecting to Nuclia Chrome extension…" : "Redirecting to Nuclia Desktop…" }}',
})
export class RedirectComponent {
  fromChromeExtension = false;
  isValidToken = combineLatest([this.sdk.nuclia.auth.isAuthenticated(), this.userService.userInfo]).pipe(
    map(([authenticated, userInfo]) => !!(authenticated && userInfo)),
  );

  constructor(private sdk: SDKService, private userService: UserService, private route: ActivatedRoute) {
    this.isValidToken
      .pipe(
        filter((valid) => valid),
        take(1),
        switchMap(() => this.route.queryParams.pipe(take(1))),
      )
      .subscribe((params) => {
        if (params['fromExtension']) {
          this.fromChromeExtension = true;
        }
        let redirectUrl: string = params['redirect'] || '';
        const matchRegex = AUTHORIZED_REDIRECTS_REGEX.some((regex) => regex.test(redirectUrl));
        if (!matchRegex && !AUTHORIZED_REDIRECTS.includes(redirectUrl)) {
          console.warn('Redirect URL not authorized');
          return;
        }
        redirectUrl += redirectUrl.includes('?') ? '&' : '?';
        const tokens = `access_token=${this.sdk.nuclia.auth.getToken()}&refresh_token=${this.sdk.nuclia.auth.getRefreshToken()}`;
        location.href = redirectUrl + tokens;
      });
  }
}
