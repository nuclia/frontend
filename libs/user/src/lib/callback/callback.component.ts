import { Component, Inject, OnInit, DOCUMENT } from '@angular/core';

import { BackendConfigurationService, SAMLService, SDKService, SsoService } from '@flaps/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthTokens } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { take } from 'rxjs';
import { UserContainerComponent } from '../user-container';
import { TranslateService } from '@ngx-translate/core';
import { getLoginErrorMessageKey, isCameFromLegit } from '../login-error.util';

@Component({
  selector: 'stf-user-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['../_user-layout.scss'],
  imports: [UserContainerComponent],
})
export class CallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private samlService: SAMLService,
    private ssoService: SsoService,
    private config: BackendConfigurationService,
    @Inject(DOCUMENT) private document: Document,
    private sdk: SDKService,
    private router: Router,
    private toaster: SisToastService,
    private translate: TranslateService,
  ) {}

  message?: string;

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['error']) {
      this.toaster.error(queryParams['error_description'] || 'login.error.oops');
      this.router.navigate(['/user/signup'], {
        relativeTo: this.route,
      });
      return;
    }

    // Handle second callback from migration flow with JWT tokens in the url
    // This is part of the legacy login flow. Once the saml flow is completed in the
    // auth app,  navigates to come_from with the tokens in the URL. This is triggerd in this
    // same component in `authenticate`, and then independently of saml or other sso, it ends
    // up here with the tokens in the URL.
    if (queryParams['token'] && queryParams['refresh_token']) {
      this.loadUrlToken();
      return;
    }

    if (this.route.snapshot.data['saml']) {
      // Returning from SAML authentication
      this.handleSAMLCallback();
    } else if (
      !this.route.snapshot.queryParamMap.get('token') &&
      (this.route.snapshot.data['google'] ||
        this.route.snapshot.data['github'] ||
        this.route.snapshot.data['microsoft'])
    ) {
      this.ssoLogin();
    } else if (queryParams['code'] && queryParams['state']) {
      // The raw returned state is still decodable even when it fails the localStorage
      // oauth_state check below (the mismatch is against what we expected, not the payload itself).
      const came_from = this.decodeCameFrom(queryParams['state']);
      this.sdk.nuclia.auth.processAuthorizationResponse(queryParams['code'], queryParams['state']).subscribe({
        next: (res) => {
          if (res.success) {
            const successCameFrom = res.state.came_from;
            if (
              successCameFrom &&
              successCameFrom !== window.location.origin &&
              isCameFromLegit(successCameFrom, this.config.getAPIOrigin())
            ) {
              window.location.href = successCameFrom;
            } else {
              this.router.navigate(['/']);
            }
          } else {
            this.toaster.error('login.error.device_mismatch');
            this.restartOAuthFromOriginatingApp('login.error.device_mismatch', came_from);
          }
        },
        error: () => {
          this.toaster.error('login.error.device_mismatch');
          this.restartOAuthFromOriginatingApp('login.error.device_mismatch', came_from);
        },
      });
    } else {
      this.router.navigate(['/user/signup'], {
        relativeTo: this.route,
      });
    }
  }

  loadUrlToken() {
    this.route.queryParams.pipe(take(1)).subscribe((params) =>
      this.authenticate({
        access_token: params['token'],
        refresh_token: params['refresh_token'] || '',
      }),
    );
  }

  handleSAMLCallback(): void {
    const consentUrl = this.route.snapshot.queryParamMap.get('consent_url');
    const token = this.route.snapshot.queryParamMap.get('token');
    const state = this.route.snapshot.queryParamMap.get('state');
    if (consentUrl) {
      // OAuth flow: navigate to consent challenge URL
      this.document.location.href = consentUrl;
    } else if (token) {
      // Regular flow: exchange token for access token and authenticate
      this.samlService.getToken(token).subscribe((authTokens) => {
        this.authenticate(authTokens, state || undefined);
      });
    } else {
      // No valid parameters
      this.toaster.error('login.error.oops');
      this.router.navigate(['/user/signup'], {
        relativeTo: this.route,
      });
    }
  }

  ssoLogin(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');

    if (code !== null && state !== null) {
      this.ssoService.login(code, state).subscribe({
        next: (response) => {
          // Check if this is an OAuth flow (login_challenge present in state)
          const decodedState = this.ssoService.decodeState(state);
          const isOAuthFlow = !!decodedState['login_challenge'];

          // If OAuth flow and response contains consent_url, redirect to it
          if (isOAuthFlow && response.consent_url) {
            this.document.location.href = response.consent_url;
          } else if (response.access_token && response.refresh_token) {
            // Regular flow: authenticate with tokens
            this.authenticate(
              {
                access_token: response.access_token,
                refresh_token: response.refresh_token,
              },
              state,
            );
          } else {
            // Invalid response
            this.router.navigate(['/user/signup'], {
              relativeTo: this.route,
              queryParams: { error: 'invalid_response' },
            });
          }
        },
        error: (error) => {
          const code = error.body?.error_code || error.body?.detail;
          if (code === 'login_challenge_expired_or_invalid') {
            // The login_challenge outlived by the time spent on the provider's own login/MFA
            // screens. Restart the OAuth flow with fresh state instead of dead-ending on signup.
            this.toaster.error('login.error.session_expired');
            this.restartOAuthFromOriginatingApp('login.error.session_expired', this.decodeCameFrom(state));
          } else if (error.message === 'Invalid state') {
            this.toaster.error('Authentication configuration error. Please contact support if this persists.');
            this.message = this.translate.instant('login.error.oops');
          } else {
            // /user/signup doesn't read an `error` query param, so render inline instead of redirecting there.
            const fallback = error.status === 412 ? 'login.error.no_personal_email' : 'login.error.oops';
            this.message = this.translate.instant(getLoginErrorMessageKey(code, fallback), {
              provider: this.getProvider(),
            });
          }
        },
      });
    }
  }

  private getProvider() {
    if (this.route.snapshot.data['google']) {
      return 'Google';
    } else if (this.route.snapshot.data['github']) {
      return 'GitHub';
    } else if (this.route.snapshot.data['microsoft']) {
      return 'Microsoft';
    }
    return undefined;
  }

  private authenticate(token: AuthTokens, state?: string): void {
    this.sdk.nuclia.auth.authenticate(token);
    const came_from = state ? this.ssoService.decodeState(state)['came_from'] : undefined;
    if (came_from && came_from !== window.location.origin && isCameFromLegit(came_from, this.config.getAPIOrigin())) {
      window.location.href = `${came_from}${window.location.pathname}?token=${token.access_token}&refresh_token=${token.refresh_token}`;
    } else {
      this.router.navigate(['/']);
    }
  }

  private decodeCameFrom(state: string): string | undefined {
    try {
      return this.ssoService.decodeState(state)['came_from'];
    } catch {
      return undefined;
    }
  }

  // The auth app has no real OAuth client_id of its own; the flow must be (re)started from
  // the originating app (came_from) itself. Land on its root instead of a specific route
  // (e.g. /user/login-redirect) so we don't assume a route convention product teams may not share.
  private restartOAuthFromOriginatingApp(message: string, came_from?: string): void {
    if (came_from && isCameFromLegit(came_from, this.config.getAPIOrigin())) {
      const url = new URL(came_from);
      url.searchParams.set('message', message);
      this.document.location.href = url.toString();
    } else {
      this.sdk.nuclia.auth.redirectToOAuth({ message });
    }
  }
}
