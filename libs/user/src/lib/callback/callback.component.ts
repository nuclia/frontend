import { Component, Inject, OnInit, DOCUMENT } from '@angular/core';

import { BackendConfigurationService, SAMLService, SDKService, SsoService } from '@flaps/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthTokens } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import { take } from 'rxjs';

@Component({
  selector: 'stf-user-callback',
  template: '<div class="user-background" style="height: 100%"></div>',
  standalone: false,
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
  ) {}

  ngOnInit() {
    console.log('[CALLBACK] ngOnInit started');
    console.log('[CALLBACK] Route data:', this.route.snapshot.data);
    console.log('[CALLBACK] Query params:', this.route.snapshot.queryParams);
    console.log('[CALLBACK] Current URL:', window.location.href);
    
    if (this.route.snapshot.queryParams['error']) {
      console.log('[CALLBACK] Error in query params:', this.route.snapshot.queryParams['error']);
      this.toaster.error(this.route.snapshot.queryParams['error_description'] || 'login.error.oops');
      this.router.navigate(['../signup'], {
        relativeTo: this.route,
      });
      return;
    }

    if (this.route.snapshot.data['saml']) {
      console.log('[CALLBACK] SAML flow detected');
      // Returning from SAML authentication
      this.getSAMLToken();
    } else if (this.route.snapshot.data['samlOauth']) {
      console.log('[CALLBACK] SAML OAuth flow detected');
      // Returning from SAML authentication in a OAuth flow
      this.redirect();
    } else if (
      !this.route.snapshot.queryParamMap.get('token') &&
      (this.route.snapshot.data['google'] ||
        this.route.snapshot.data['github'] ||
        this.route.snapshot.data['microsoft'])
    ) {
      console.log('[CALLBACK] SSO flow detected (google/github/microsoft)');
      this.ssoLogin();
    } else {
      console.log('[CALLBACK] URL token flow detected');
      this.loadUrlToken();
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

  getSAMLToken(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.samlService.getToken(token).subscribe((token) => {
        this.authenticate(token);
      });
    }
  }

  redirect(): void {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirect_to');
    if (redirectTo) {
      const allowedHosts = this.config.getAllowedHostsRedirect();
      try {
        const url = new URL(redirectTo);
        if (allowedHosts.indexOf(url.hostname) >= 0) {
          this.document.location.href = redirectTo;
        }
      } catch {}
    }
  }

  ssoLogin(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');
    console.log('[CALLBACK] ssoLogin - code:', code ? 'present' : 'missing');
    console.log('[CALLBACK] ssoLogin - state:', state ? 'present' : 'missing');
    
    if (code !== null && state !== null) {
      console.log('[CALLBACK] Calling ssoService.login()');
      this.ssoService.login(code, state).subscribe({
        next: (response) => {
          console.log('[CALLBACK] ssoService.login SUCCESS');
          console.log('[CALLBACK] Response has access_token:', !!response.access_token);
          console.log('[CALLBACK] Response has refresh_token:', !!response.refresh_token);
          console.log('[CALLBACK] Response has consent_url:', !!response.consent_url);
          
          // Check if this is an OAuth flow (login_challenge present in state)
          const decodedState = this.ssoService.decodeState(state);
          const isOAuthFlow = !!decodedState['login_challenge'];
          console.log('[CALLBACK] Is OAuth flow:', isOAuthFlow);
          
          // If OAuth flow and response contains consent_url, redirect to it
          if (isOAuthFlow && response.consent_url) {
            console.log('[CALLBACK] Redirecting to consent_url:', response.consent_url);
            this.document.location.href = response.consent_url;
          } else if (response.access_token && response.refresh_token) {
            console.log('[CALLBACK] Regular flow - calling authenticate()');
            // Regular flow: authenticate with tokens
            this.authenticate(
              {
                access_token: response.access_token,
                refresh_token: response.refresh_token,
              },
              state,
            );
          } else {
            console.log('[CALLBACK] Invalid response - no tokens, redirecting to signup with error');
            // Invalid response
            this.router.navigate(['../signup'], {
              relativeTo: this.route,
              queryParams: { error: 'oops' },
            });
          }
        },
        error: (error) => {
          console.log('[CALLBACK] ssoService.login ERROR');
          console.log('[CALLBACK] Error status:', error.status);
          console.log('[CALLBACK] Error details:', error);
          this.router.navigate(['../signup'], {
            relativeTo: this.route,
            queryParams: {
              error: error.status === 412 ? 'no_personal_email' : 'oops',
            },
          });
        },
      });
    }
  }

  private authenticate(token: AuthTokens, state?: string): void {
    console.log('[CALLBACK] authenticate() called');
    console.log('[CALLBACK] Token present:', !!token.access_token);
    this.sdk.nuclia.auth.authenticate(token);
    const came_from = state ? this.ssoService.decodeState(state)['came_from'] : undefined;
    console.log('[CALLBACK] came_from:', came_from);
    console.log('[CALLBACK] window.location.origin:', window.location.origin);
    if (came_from && came_from !== window.location.origin) {
      console.log('[CALLBACK] Redirecting to came_from with tokens');
      window.location.href = `${came_from}${window.location.pathname}?token=${token.access_token}&refresh_token=${token.refresh_token}`;
    } else {
      console.log('[CALLBACK] Navigating to root /');
      this.router.navigate(['/']);
    }
  }
}
