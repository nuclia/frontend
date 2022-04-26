import { Router } from '@angular/router';
import { StateService } from '@flaps/auth';
import { throwError } from 'rxjs';
import { NavigationService } from '../services/navigation.service';

export function resetStateOn403(navigation: NavigationService, state: StateService, router: Router) {
  return (error: any) => {
    if (
      error.status === 403 ||
      error.status === 0 // For some unknown reason somtimes 0 is returned instead of 403
    ) {
      state.dbDelStateData();
      state.cleanAccount();
      router.navigate([navigation.getAccountSelectUrl()]);
    }
    return throwError(error);
  };
}
