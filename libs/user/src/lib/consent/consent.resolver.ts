import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
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
        
        // Add each scope as a separate form field
        data.requested_scope.forEach((scope) => {
          const scopeInput = document.createElement('input');
          scopeInput.type = 'hidden';
          scopeInput.name = 'grant_scope';
          scopeInput.value = scope;
          form.appendChild(scopeInput);
        });
        
        document.body.appendChild(form);
        form.submit();
      }
    }),
    switchMap((data) => (data.skip_consent ? EMPTY : of(data))),
    catchError(() => of(null)),
  );
};
