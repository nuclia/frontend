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

  @ViewChild('form') form: ElementRef | undefined;

  constructor(private route: ActivatedRoute, private oAuthService: OAuthService) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.has('error')) {
      this.error = 'login.error.' + params.get('error');
      return;
    }
    this.consentChallenge = params.get('consent_challenge');
    if (this.consentChallenge) {
      this.oAuthService.getConsentData(this.consentChallenge).subscribe({
        next: (data) => {
          this.consentData = data;
          if (this.consentData.skip_consent) {
            setTimeout(() => this.acceptConsent(), 10);
          }
        },
        error: () => {
          this.error = 'login.error.unknown_consent_challenge';
        },
      });
    } else {
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
