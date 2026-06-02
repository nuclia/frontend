import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { catchError, first, map } from 'rxjs';

export const canMatchSimpleMode: CanMatchFn = () => {
  const navigation = inject(NavigationService);
  const sdk = inject(SDKService);
  const router = inject(Router);

  // Extract account slug from the current navigation URL (/at/:account/manage/home → segments[1])
  const primarySegments = router.getCurrentNavigation()?.extractedUrl?.root?.children?.['primary']?.segments;
  const accountSlug = primarySegments?.[1]?.path;

  if (!accountSlug) {
    return navigation.simpleMode.pipe(first());
  }

  // setCurrentAccount is idempotent — returns cached Account if already loaded.
  // On page refresh, this ensures we read the real account workflow before setAccountGuard
  // (canActivate) has had a chance to run.
  return sdk.setCurrentAccount(accountSlug).pipe(
    first(),
    map((account) => account.workflow === 'cowork'),
    catchError(() => navigation.simpleMode.pipe(first())),
  );
};
