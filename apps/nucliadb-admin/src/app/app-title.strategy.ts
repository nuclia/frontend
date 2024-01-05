import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { SDKService } from '@flaps/core';
import { map, take } from 'rxjs';

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
      this.title.setTitle(`NucliaDB – ${specificRouteTitle}`);
    } else if (routerState.url.includes(`/at`) || routerState.url.includes(`/select/`)) {
      this.sdk.currentKb
        .pipe(
          take(1),
          map((kb) => `NucliaDB – ${kb.title}`),
        )
        .subscribe((title) => this.title.setTitle(title));
    }
  }
}
