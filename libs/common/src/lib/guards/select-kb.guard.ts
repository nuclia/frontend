import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { NavigationService, SelectAccountKbService } from '@flaps/common';
import { inject } from '@angular/core';
import { SDKService, ZoneService } from '@flaps/core';
import { filter, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';

export const selectKbGuard = (route: ActivatedRouteSnapshot) => {
  const selectService: SelectAccountKbService = inject(SelectAccountKbService);
  const navigation: NavigationService = inject(NavigationService);
  const sdk: SDKService = inject(SDKService);
  const router: Router = inject(Router);
  const zoneService: ZoneService = inject(ZoneService);

  const accountSlug = route.paramMap.get('account');

  if (sdk.nuclia.options.standalone) {
    selectService.selectAccount('local').subscribe();
  }

  const isKbListReady = sdk.currentAccount.pipe(
    filter((account) => account.slug === accountSlug),
    switchMap(() => sdk.refreshingKbList),
    filter((refreshing) => !refreshing),
  );

  const zoneList = selectService.standalone ? of([]) : zoneService.getZones();

  return accountSlug
    ? zoneList.pipe(
        switchMap((zones) => isKbListReady.pipe(switchMap(() => sdk.kbList.pipe(map((kbs) => ({ kbs, zones })))))),
        switchMap(({ kbs, zones }) => {
          if (kbs.length === 0) {
            return selectService.standalone
              ? of(true)
              : sdk.currentAccount.pipe(
                  map((account) =>
                    account.can_manage_account ? router.createUrlTree([navigation.getAccountUrl(accountSlug)]) : true,
                  ),
                );
          } else if (kbs.length === 1 && !selectService.standalone) {
            // if there's only one KB, and we're not in NucliaDB admin app, then we automatically select the KB
            sdk.nuclia.options.zone = kbs[0].zone;

            return of(router.createUrlTree([navigation.getKbUrl(accountSlug, kbs[0].slug || '')]));
          } else {
            return of(true);
          }
        }),
      )
    : of(router.createUrlTree(['/select']));
};
