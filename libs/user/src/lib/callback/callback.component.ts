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
    if (this.route.snapshot.queryParams['error']) {
      this.toaster.error(this.route.snapshot.queryParams['error_description'] || 'login.error.oops');
      this.router.navigate(['../signup'], {
        relativeTo: this.route,
      });
    }

    if (this.route.snapshot.data['saml']) {
      // Returning from SAML authentication
      this.getSAMLToken();
    } else if (this.route.snapshot.data['samlOauth']) {
      // Returning from SAML authentication in a OAuth flow
      this.redirect();
    } else if (
      !this.route.snapshot.queryParamMap.get('token') &&
      (this.route.snapshot.data['google'] ||
        this.route.snapshot.data['github'] ||
        this.route.snapshot.data['microsoft'])
    ) {
      this.ssoLogin();
    } else {
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
    if (code !== null && state !== null) {
      this.ssoService.login(code, state).subscribe({
        next: (token) => this.authenticate(token, state),
        error: (error) =>
          this.router.navigate(['../signup'], {
            relativeTo: this.route,
            queryParams: {
              error: error.status === 412 ? 'no_personal_email' : 'oops',
            },
          }),
      });
    }
  }

  private authenticate(token: AuthTokens, state?: string): void {
    this.sdk.nuclia.auth.authenticate(token);
    const came_from = state ? this.ssoService.decodeState(state)['came_from'] : undefined;
    if (came_from && came_from !== window.location.origin) {
      window.location.href = `${came_from}${window.location.pathname}?token=${token.access_token}&refresh_token=${token.refresh_token}`;
    } else {
      this.router.navigate(['/']);
    }
  }
}
