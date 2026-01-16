import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { OAuthConsentData, OAuthService } from '@flaps/core';

export const consentResolver: ResolveFn<OAuthConsentData | null> = (
  route: ActivatedRouteSnapshot,
): Observable<OAuthConsentData | null> => {
  const oAuthService = inject(OAuthService);
  const consentChallenge = route.queryParamMap.get('consent_challenge');

  if (!consentChallenge) {
    return of(null);
  }

  return oAuthService.getConsentData(consentChallenge).pipe(
    tap((data) => {
      if (data.skip_consent) {
        // Auto-submit the form by creating and submitting it programmatically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = oAuthService.consentUrl();
        
        const challengeInput = document.createElement('input');
        challengeInput.type = 'hidden';
        challengeInput.name = 'consent_challenge';
        challengeInput.value = consentChallenge;
        form.appendChild(challengeInput);
        
        const scopesInput = document.createElement('input');
        scopesInput.type = 'hidden';
        scopesInput.name = 'accepted_scopes';
        scopesInput.value = JSON.stringify(data.requested_scope);
        form.appendChild(scopesInput);
        
        document.body.appendChild(form);
        form.submit();
      }
    }),
    map((data) => (data.skip_consent ? null : data)),
    catchError(() => of(null)),
  );
};
