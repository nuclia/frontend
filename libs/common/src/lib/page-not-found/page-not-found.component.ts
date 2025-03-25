import { Component, inject, ViewEncapsulation } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { BackendConfigurationService } from '@flaps/core';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class PageNotFoundComponent {
  baseHref = inject(APP_BASE_HREF, { optional: true }) || '/';
  private backendConfig = inject(BackendConfigurationService);
  assetsPath = this.backendConfig.getAssetsPath();
  brandName = this.backendConfig.getBrandName();
}
