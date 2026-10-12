import { Component, inject, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { APP_BASE_HREF, AsyncPipe } from '@angular/common';
import { BrandService } from '@flaps/core';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AsyncPipe],
})
export class PageNotFoundComponent {
  baseHref = inject(APP_BASE_HREF, { optional: true }) || '/';
  private brandService = inject(BrandService);
  logoPath = this.brandService.logoPath;
  brandName = this.brandService.brandName;
}
