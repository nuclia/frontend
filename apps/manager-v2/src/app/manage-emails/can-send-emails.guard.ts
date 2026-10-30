import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '@flaps/core';
import { filter, map, take } from 'rxjs';

// The user type is unknown until the welcome call resolves, so wait for it before deciding.
export const canSendEmailsGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(UserService).userType.pipe(
    filter((type) => !!type),
    take(1),
    map((type) => type === 'ROOT' || router.createUrlTree(['/'])),
  );
};
