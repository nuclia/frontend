import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { Observable } from 'rxjs';

export interface TestingSignupRequest {
  email: string;
  fullname?: string;
  company?: string;
  workflow?: string;
}

export interface TestingSignupResponse {
  signup_token: string;
  expires_at: string;
}

@Injectable()
export class TestingSignupService {
  private sdk = inject(SDKService);

  startSignup(key: string, payload: TestingSignupRequest): Observable<TestingSignupResponse> {
    return this.sdk.nuclia.rest.post<TestingSignupResponse>(
      `${this.sdk.nuclia.auth.getAuthUrl()}/signup/start`,
      payload,
      { Authorization: `Bearer ${key}` },
    );
  }
}
