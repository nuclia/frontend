import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { NavigationService, SDKService } from '@flaps/core';
import { AuthTokens } from '@nuclia/core';
import { catchError, of, switchMap } from 'rxjs';

export const awsGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sdk = inject(SDKService);
  const navigation = inject(NavigationService);

  const customerToken = route.queryParams['customer_token'];
  return customerToken
    ? sdk.nuclia.rest
        .post<AuthTokens>(`/marketplace/aws/login`, {
          customer_token: customerToken,
        })
        .pipe(
          catchError((error) =>
            error?.body?.error_code === 'AWS_MP_CUSTOMER_NOT_FOUND' ? of('NOT_FOUND') : of('ERROR'),
          ),
          switchMap((result) => {
            if (typeof result === 'string') {
              return result === 'NOT_FOUND'
                ? of(true)
                : router.navigate(['/user/login'], { queryParams: { error: 'aws.invalid_customer_token' } });
            } else {
              sdk.nuclia.auth.authenticate(result);
              return sdk.nuclia.db
                .getAccounts()
                .pipe(
                  switchMap((accounts) =>
                    accounts.length === 0
                      ? of(true)
                      : accounts.length === 1
                        ? router.navigate([navigation.getAccountManageUrl(accounts[0].slug)])
                        : router.navigate([navigation.getAccountSelectUrl()]),
                  ),
                );
            }
          }),
        )
    : router.navigate(['/user/login'], { queryParams: { error: 'aws.missing_customer_token' } });
};
