import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OAuthConsentData, OAuthService } from '@flaps/core';

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
  logoPath = this.oAuthService.cameFromLogo;
  brandName = this.oAuthService.cameFromBrandName;

  @ViewChild('form') form: ElementRef | undefined;
  @ViewChild('rejectForm') rejectForm: ElementRef | undefined;

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
    return (this.consentData?.requested_scope || []).filter((scope: string) => !INVISIBLE_SCOPES.includes(scope));
  }

  acceptedScopes(): string {
    return JSON.stringify(this.consentData?.requested_scope || []);
  }

  scopeKey(scope: string): string {
    return scope.replaceAll(':', '.');
  }

  acceptConsent() {
    this.form?.nativeElement.submit();
  }

  rejectConsent() {
    this.rejectForm?.nativeElement.submit();
  }
}
