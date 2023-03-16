import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseComponent } from './base.component';
import { TopbarModule } from '../topbar';
import { DashboardLayoutComponent } from './dashboard-layout/dashboard-layout.component';
import { STFSidebarModule } from '../sidebar';
import { NavbarModule } from '../navbar';

@NgModule({
  declarations: [BaseComponent, DashboardLayoutComponent],
  exports: [BaseComponent, DashboardLayoutComponent],
  imports: [RouterModule, TopbarModule, STFSidebarModule, NavbarModule],
})
export class BaseModule {}
