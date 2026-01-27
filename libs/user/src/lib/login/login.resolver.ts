import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { OAuthLoginData, OAuthService } from '@flaps/core';

export const loginResolver: ResolveFn<OAuthLoginData | null> = (
  route: ActivatedRouteSnapshot,
): Observable<OAuthLoginData | null> => {
  const oAuthService = inject(OAuthService);
  const loginChallenge = route.queryParamMap.get('login_challenge');

  if (!loginChallenge) {
    return of(null);
  }

  return oAuthService.getLoginData(loginChallenge).pipe(
    tap((data) => {
      if (data.skip_login) {
        // Auto-submit the form by creating and submitting it programmatically
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = oAuthService.loginUrl();
        
        const challengeInput = document.createElement('input');
        challengeInput.type = 'hidden';
        challengeInput.name = 'login_challenge';
        challengeInput.value = loginChallenge;
        form.appendChild(challengeInput);
        
        document.body.appendChild(form);
        form.submit();
      }
    }),
    switchMap((data) => (data.skip_login ? EMPTY : of(data))),
    catchError(() => of(null)),
  );
};
