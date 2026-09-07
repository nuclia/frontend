import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService, OAuthService } from '@flaps/core';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private oAuthService = inject(OAuthService);
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const specificRouteTitle = this.buildTitle(routerState);

    this.oAuthService.cameFromBrandName.subscribe((brandName) => {
      this.title.setTitle(specificRouteTitle ? `${brandName} – ${specificRouteTitle}` : brandName);
    });
  }
}
