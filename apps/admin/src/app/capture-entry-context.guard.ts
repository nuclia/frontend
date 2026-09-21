import { inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { AccountEntryContextService } from '@flaps/core';

/** Persists `from`/`app` query params so the app can navigate back to wherever the user
 *  entered `admin` from. Best-effort — never blocks navigation. */
export const captureEntryContextGuard = (route: ActivatedRouteSnapshot) => {
  const entryContext = inject(AccountEntryContextService);
  const from = route.queryParamMap.get('from');
  const app = route.queryParamMap.get('app');
  entryContext.captureFromQueryParams(from, app);
  return true;
};
