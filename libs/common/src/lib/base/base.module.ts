import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseComponent } from './base.component';
import { TopbarModule } from '../topbar';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { NavbarModule } from '../navbar';
import { CommonModule } from '@angular/common';
import { PaSideNavModule } from '@guillotinaweb/pastanaga-angular';
import { NotificationsPanelComponent } from '@flaps/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { UploadBarComponent } from '../upload';

@NgModule({
  declarations: [BaseComponent, DashboardLayoutComponent],
  exports: [BaseComponent, DashboardLayoutComponent],
  imports: [
    CommonModule,
    NavbarModule,
    RouterModule,
    TopbarModule,
    PaSideNavModule,
    NotificationsPanelComponent,
    InfoCardComponent,
    TranslateModule,
    UploadBarComponent,
  ],
})
export class BaseModule {}
