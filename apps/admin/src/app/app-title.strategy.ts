import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BrandService, SDKService } from '@flaps/core';
import { forkJoin, map, of, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private brandService = inject(BrandService);
  constructor(
    private readonly title: Title,
    private sdk: SDKService,
  ) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const specificRouteTitle = this.buildTitle(routerState);

    this.brandService.brandName
      .pipe(
        take(1),
        switchMap((brandName) => {
          if (specificRouteTitle) {
            return of(`${brandName} – ${specificRouteTitle}`);
          } else if (routerState.url.includes(`/at`) || routerState.url.includes(`/select/`)) {
            return forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.hasKb.pipe(take(1))]).pipe(
              switchMap(([account, hasKb]) => {
                const baseTitle = `${brandName} – ${account.title}`;
                return hasKb
                  ? this.sdk.currentKb.pipe(
                      take(1),
                      map((kb) => `${baseTitle} – ${kb.title}`),
                    )
                  : of(baseTitle);
              }),
            );
          } else {
            return of(brandName);
          }
        }),
      )
      .subscribe((title) => this.title.setTitle(title));
  }
}
