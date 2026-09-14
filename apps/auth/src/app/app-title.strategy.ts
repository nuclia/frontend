import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BrandService } from '@flaps/core';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private brandService = inject(BrandService);
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const specificRouteTitle = this.buildTitle(routerState);

    this.brandService.brandName.subscribe((brandName) => {
      this.title.setTitle(specificRouteTitle ? `${brandName} – ${specificRouteTitle}` : brandName);
    });
  }
}
