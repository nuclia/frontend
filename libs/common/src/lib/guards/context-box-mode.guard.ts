import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NavigationService } from '@flaps/core';
import { map, of, switchMap, take } from 'rxjs';

export const contextBoxModeGuard: CanActivateFn = () => {
  const navigationService = inject(NavigationService);
  const router = inject(Router);

  return navigationService.contextBoxMode.pipe(
    take(1),
    switchMap((isContextBoxMode) => {
      if (!isContextBoxMode) {
        return of(true);
      }
      return navigationService.kbUrl.pipe(
        take(1),
        map((kbUrl) => router.createUrlTree([`${kbUrl}/simple`])),
      );
    }),
  );
};
