import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {} from '../models';
import { AuthTokens, SAMLInquiryResult } from '../models/user.model';
import { BackendConfigurationService } from '../backend-config.service';
import { SDKService } from '../sdk.service';

const STF_SAML = '/auth/saml/';
const STF_INQUIRY = 'inquiry';
const STF_SSO = 'sso';
const STF_TOKEN = 'token';

@Injectable({
  providedIn: 'root',
})
export class SAMLService {
  constructor(private config: BackendConfigurationService, private sdk: SDKService) {}

  checkDomain(domain: string): Observable<SAMLInquiryResult> {
    return this.sdk.nuclia.rest.get<SAMLInquiryResult>(
      this.config.getAPIURL() + STF_SAML + STF_INQUIRY + '?domain=' + domain,
    );
  }

  ssoUrl(accountId: string, loginChallenge?: string): string {
    let url = this.config.getAPIURL() + STF_SAML + STF_SSO + '?account_id=' + accountId;
    if (loginChallenge) {
      url += '&login_challenge=' + loginChallenge;
    }
    return url;
  }

  getToken(tmpToken: string): Observable<AuthTokens> {
    const data = {
      token: tmpToken,
    };
    return this.sdk.nuclia.rest.post<AuthTokens>(this.config.getAPIURL() + STF_SAML + STF_TOKEN, data);
  }
}
