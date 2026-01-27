import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendConfigurationService, OAuthConsentData, OAuthService } from '@flaps/core';

const INVISIBLE_SCOPES = ['offline'];

@Component({
  selector: 'stf-consent',
  templateUrl: './consent.component.html',
  styleUrls: ['./consent.component.scss'],
  standalone: false,
})
export class ConsentComponent implements OnInit {
  consentChallenge: string | null = null;
  consentData: OAuthConsentData | undefined;
  error: string | null = null;
  private backendConfig = inject(BackendConfigurationService);
  logoPath = this.backendConfig.getLogoPath();
  brandName = this.backendConfig.getBrandName();

  @ViewChild('form') form: ElementRef | undefined;

  constructor(
    private route: ActivatedRoute,
    private oAuthService: OAuthService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.has('error')) {
      this.error = 'login.error.' + params.get('error');
      return;
    }
    this.consentChallenge = params.get('consent_challenge');
    
    // Get data from resolver - resolver handles skip_consent auto-submit before component loads
    this.consentData = this.route.snapshot.data['consentData'];
    
    if (!this.consentData && !this.consentChallenge) {
      this.error = 'login.error.unknown_consent_challenge';
    }
  }

  oAuthConsentUrl() {
    return this.oAuthService.consentUrl();
  }

  visibleScopes(): string[] {
    return (this.consentData?.requested_scope || []).filter((scope: string) => INVISIBLE_SCOPES.indexOf(scope) == -1);
  }

  acceptedScopes(): string {
    return JSON.stringify(this.consentData?.requested_scope || []);
  }

  acceptConsent() {
    this.form?.nativeElement.submit();
  }
}
