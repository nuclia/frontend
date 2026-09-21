import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { NavigationService } from '@flaps/core';

/** Old `/at/:account/manage/**` URLs now live in the standalone `admin` app — always redirect. */
export const redirectToAdminGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const navigation = inject(NavigationService);
  const accountSlug = route.paramMap.get('account') as string;
  const [pathname, search] = state.url.split('?');
  const subpath = pathname.replace(/^.*\/manage\/?/, '');

  const url = `${navigation.getAccountManageUrl(accountSlug)}${subpath ? `/${subpath}` : ''}`;
  const queryParams = search ? Object.fromEntries(new URLSearchParams(search).entries()) : undefined;
  return navigation.resolveGuardRedirect(url, { queryParams, withFromApp: true });
};
