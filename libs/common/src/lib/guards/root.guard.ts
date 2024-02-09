import { inject } from '@angular/core';
import { NavigationService } from '@flaps/core';

export const rootGuard = () => {
  const navigation: NavigationService = inject(NavigationService);
  navigation.goToLandingPage();
  return false;
};
