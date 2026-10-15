import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotificationsPanelComponent, ResourceHandlingBannerComponent } from '@flaps/core';
import { PaSideNavModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { NavbarModule } from '../navbar';
import { TopbarModule } from '../topbar';
import { UploadBarComponent } from '../upload';
import { BaseComponent } from './base.component';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';

@NgModule({
  exports: [BaseComponent, DashboardLayoutComponent],
  imports: [
    CommonModule,
    NavbarModule,
    RouterModule,
    TopbarModule,
    PaSideNavModule,
    NotificationsPanelComponent,
    InfoCardComponent,
    TranslatePipe,
    UploadBarComponent,
    BaseComponent,
    DashboardLayoutComponent,
    ResourceHandlingBannerComponent,
  ],
})
export class BaseModule {}
