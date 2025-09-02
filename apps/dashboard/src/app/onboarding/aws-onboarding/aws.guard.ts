import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const awsGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const customerToken = route.queryParams['customer_token'];
  return customerToken
    ? true
    : router.navigate(['/user/login'], { queryParams: { error: 'aws.missing_customer_token' } });
};
