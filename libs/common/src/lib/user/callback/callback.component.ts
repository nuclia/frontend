import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BackendConfigurationService, SAMLService, SDKService, SsoService } from '@flaps/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthTokens } from '@nuclia/core';

@Component({
  selector: 'stf-user-callback',
  template: '<div class="user-background"></div>',
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
  ) {}

  ngOnInit() {
    if (this.route.snapshot.data.saml) {
      // Returning from SAML authentification
      this.getSAMLToken();
    } else if (this.route.snapshot.data.samlOauth) {
      // Returning from SAML authentification in a OAuth flow
      this.redirect();
    } else if (this.route.snapshot.data.google || this.route.snapshot.data.github) {
      this.ssoLogin();
    } else {
      this.loadUrlToken();
    }
  }

  loadUrlToken() {
    this.route.queryParams.subscribe((params) =>
      this.authenticate({
        access_token: params['token'],
        refresh_token: '',
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
      const allowedHosts = this.config.getAllowdHostsRedirect();
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
      this.ssoService.login(code, state).subscribe((token) => {
        this.authenticate(token);
      });
    }
  }

  private authenticate(token: AuthTokens): void {
    this.sdk.nuclia.auth.authenticate(token);
    this.router.navigate(['/']);
  }
}
