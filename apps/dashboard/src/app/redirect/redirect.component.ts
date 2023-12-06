import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SDKService, UserService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { take, map, filter, switchMap, combineLatest, from } from 'rxjs';

const AUTHORIZED_REDIRECTS = ['nuclia-desktop://', 'http://localhost:4200'];
const AUTHORIZED_REDIRECTS_REGEX = [/^chrome\-extension\:\/\/[a-z]+\/options\/options\.html$/];

@Component({
  templateUrl: './redirect.component.html',
  styleUrls: ['./redirect.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectComponent {
  fromChromeExtension = false;
  fromMarketPlace = false;
  isValidToken = combineLatest([this.sdk.nuclia.auth.isAuthenticated(), this.userService.userInfo]).pipe(
    map(([authenticated, userInfo]) => !!(authenticated && userInfo)),
  );
  token = this.sdk.nuclia.auth.getToken();
  displayToken = this.route.queryParamMap.pipe(map((params) => params.get('display') === 'token'));
  copied = false;

  constructor(
    private sdk: SDKService,
    private userService: UserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
  ) {
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
        if (params['marketplace_callback_url']) {
          this.fromMarketPlace = true;
          this.redirectToMarketplace(params['marketplace_callback_url']);
        }
        let redirectUrl: string = params['redirect'] || '';
        if (redirectUrl) {
          const matchRegex = AUTHORIZED_REDIRECTS_REGEX.some((regex) => regex.test(redirectUrl));
          if (!matchRegex && !AUTHORIZED_REDIRECTS.includes(redirectUrl)) {
            console.warn('Redirect URL not authorized');
            return;
          }
          redirectUrl += redirectUrl.includes('?') ? '&' : '?';
          const tokens = `access_token=${this.sdk.nuclia.auth.getToken()}&refresh_token=${this.sdk.nuclia.auth.getRefreshToken()}`;
          location.href = redirectUrl + tokens;
        }
      });
  }

  copy() {
    navigator.clipboard.writeText(this.token);
    this.copied = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copied = false;
      this.cdr.markForCheck();
    }, 2000);
  }

  private redirectToMarketplace(url: string) {
    from(
      fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.sdk.nuclia.auth.getToken()}`,
        },
      }),
    ).subscribe((res) => {
      if (res.ok) {
        this.toaster.success('redirect.marketplace.success');
      } else {
        this.toaster.error('redirect.marketplace.error');
      }
    });
  }
}
