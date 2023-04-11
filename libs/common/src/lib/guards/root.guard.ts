import { inject } from '@angular/core';
import { NavigationService } from '../services';

export const rootGuard = () => {
  const navigation: NavigationService = inject(NavigationService);
  navigation.goToLandingPage();
  return false;
};
