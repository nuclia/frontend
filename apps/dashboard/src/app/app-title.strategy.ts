import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SDKService } from '@flaps/core';
import { forkJoin, map, of, switchMap, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(
    private readonly title: Title,
    private sdk: SDKService,
  ) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const specificRouteTitle = this.buildTitle(routerState);

    if (specificRouteTitle) {
      this.title.setTitle(`Nuclia – ${specificRouteTitle}`);
    } else if (routerState.url.includes(`/at`) || routerState.url.includes(`/select/`)) {
      forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.hasKb.pipe(take(1))])
        .pipe(
          switchMap(([account, hasKb]) => {
            const baseTitle = `Nuclia – ${account.title}`;
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
