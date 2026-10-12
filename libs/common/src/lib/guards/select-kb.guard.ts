import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { NavigationService, SDKService, SelectAccountKbService, ZoneService } from '@flaps/core';
import { combineLatest, filter, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { OnboardingService } from '../onboarding';

export const selectKbGuard = (route: ActivatedRouteSnapshot) => {
  const selectService: SelectAccountKbService = inject(SelectAccountKbService);
  const navigation: NavigationService = inject(NavigationService);
  const sdk: SDKService = inject(SDKService);
  const router: Router = inject(Router);
  const zoneService: ZoneService = inject(ZoneService);
  const onboardingService = inject(OnboardingService);

  const accountSlug = route.paramMap.get('account');

  const isListReady = sdk.currentAccount.pipe(
    filter((account) => account.slug === accountSlug),
    switchMap(() => combineLatest([sdk.refreshingKbList, sdk.refreshingAragList])),
    filter(([refreshingKbs, refreshingArags]) => !refreshingKbs && !refreshingArags),
  );

  const zoneList = zoneService.getZones();
  const aragList = sdk.aragList;

  return accountSlug
    ? zoneList.pipe(
        switchMap((zones) =>
          isListReady.pipe(
            switchMap(() => combineLatest([sdk.kbList, aragList]).pipe(map(([kbs, arags]) => ({ kbs, arags, zones })))),
          ),
        ),
        switchMap(({ kbs, arags }) => {
          const total = kbs.length + arags.length;
          if (total === 0) {
            return sdk.currentAccount.pipe(
              map((account) =>
                account.can_manage_account
                  ? navigation.resolveGuardRedirect(navigation.getAccountManageUrl(accountSlug), {
                      withFromApp: true,
                    })
                  : true,
              ),
            );
          } else if (
            !navigation.inRaoApp &&
            kbs.length === 1 &&
            (total === 1 || kbs[0].title === onboardingService.contextBoxKbName) &&
            !!kbs[0].role_on_kb
          ) {
            // if there's only one KB (or a Context box), and we're not in NucliaDB admin app or RAO app, then we automatically select the KB
            sdk.nuclia.options.zone = kbs[0].zone;

            return of(router.createUrlTree([navigation.getKbUrl(accountSlug, kbs[0].slug || '')]));
          } else if (total === 1 && arags.length === 1 && !!arags[0].role_on_kb) {
            // if there's only one ARAG, and we're not in NucliaDB admin app, then we automatically select the ARAG
            sdk.nuclia.options.zone = arags[0].zone;

            return of(router.createUrlTree([navigation.getRetrievalAgentUrl(accountSlug, arags[0].slug || '')]));
          } else {
            return of(true);
          }
        }),
      )
    : of(router.createUrlTree(['/select']));
};
