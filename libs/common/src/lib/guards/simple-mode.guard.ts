import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { NavigationService } from '@flaps/core';
import { map, of, switchMap, take } from 'rxjs';

export const simpleModeGuard: CanActivateFn = () => {
  const navigationService = inject(NavigationService);
  const router = inject(Router);

  return navigationService.simpleMode.pipe(
    take(1),
    switchMap((isSimpleMode) => {
      if (!isSimpleMode) {
        return of(true);
      }
      return navigationService.kbUrl.pipe(
        take(1),
        map((kbUrl) => router.createUrlTree([`${kbUrl}/simple`])),
      );
    }),
  );
};
