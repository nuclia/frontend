import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SDKService } from '@flaps/core';
import { catchError, switchMap } from 'rxjs/operators';
import { map } from 'rxjs';
import { AuthTokens } from '@nuclia/core';

export const awsGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sdk = inject(SDKService);

  const customerToken = route.queryParams['customer_token'];
  return customerToken
    ? sdk.nuclia.rest
        .post<AuthTokens & { account_id: string }>(`/marketplace/aws/setup_account`, {
          customer_token: customerToken,
        })
        .pipe(
          switchMap((result) =>
            sdk.setCurrentAccount(result.account_id).pipe(map(() => sdk.nuclia.auth.authenticate(result))),
          ),
          catchError((error) => {
            return router.navigate(['/user/login'], { queryParams: { error: 'aws.invalid_customer_token' } });
          }),
        )
    : router.navigate(['/user/login'], { queryParams: { error: 'aws.missing_customer_token' } });
};
