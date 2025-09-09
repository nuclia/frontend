import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BackendConfigurationService, SDKService } from '@flaps/core';
import { forkJoin, map, of, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private backendConfig = inject(BackendConfigurationService);
  constructor(
    private readonly title: Title,
    private sdk: SDKService,
  ) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const specificRouteTitle = this.buildTitle(routerState);
    const brandName = this.backendConfig.getBrandName();

    if (specificRouteTitle) {
      this.title.setTitle(`${brandName} – ${specificRouteTitle}`);
    } else if (routerState.url.includes(`/at`) || routerState.url.includes(`/select/`)) {
      forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.hasKb.pipe(take(1))])
        .pipe(
          switchMap(([account, hasKb]) => {
            const baseTitle = `${brandName} – ${account.title}`;
            return hasKb
              ? this.sdk.currentKb.pipe(
                  take(1),
                  map((kb) => `${baseTitle} – ${kb.title}`),
                )
              : of(baseTitle);
          }),
        )
        .subscribe((title) => this.title.setTitle(title));
    }
  }
}
