import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { NavigationService, SDKService } from '@flaps/core';
import { catchError, switchMap } from 'rxjs/operators';
import { forkJoin, of, tap } from 'rxjs';
import { AuthTokens } from '@nuclia/core';

export const awsGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sdk = inject(SDKService);
  const navigation = inject(NavigationService);

  const customerToken = route.queryParams['customer_token'];
  return customerToken
    ? sdk.nuclia.rest
        .post<AuthTokens & { account_id: string }>(`/marketplace/aws/setup_account`, {
          customer_token: customerToken,
        })
        .pipe(
          tap((result) => sdk.nuclia.auth.authenticate(result)),
          switchMap((result) =>
            sdk.setCurrentAccount(result.account_id).pipe(
              switchMap((account) =>
                forkJoin([
                  sdk.nuclia.db.getKnowledgeBoxes(account.slug, account.id),
                  sdk.nuclia.db.getAccountInvitations(account.id),
                  sdk.nuclia.db.getAccountUsers(account.slug),
                ]).pipe(
                  switchMap(([kbs, invitations, users]) => {
                    const accountAlreadySet = kbs.length > 0 || invitations.length > 0 || users.length > 1;
                    return accountAlreadySet
                      ? router.navigate([navigation.getAccountManageUrl(account.slug)])
                      : of(true);
                  }),
                ),
              ),
              catchError((error) => {
                console.warn(`Failed to load account ${result.account_id}`, error);
                return of(true);
              }),
            ),
          ),
          catchError((error) => {
            return router.navigate(['/user/login'], { queryParams: { error: 'aws.invalid_customer_token' } });
          }),
        )
    : router.navigate(['/user/login'], { queryParams: { error: 'aws.missing_customer_token' } });
};
