import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';

import {
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaPopupModule,
  PaTabsModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent } from '@nuclia/sistema';
import { ActivityDownloadComponent } from './activity-download.component';
import { ActivityLogTableComponent } from './log-table.component';

const ROUTES = [
  {
    path: '',
    component: ActivityDownloadComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,

    RouterModule.forChild(ROUTES),
    PaButtonModule,
    PaTabsModule,
    PaIconModule,
    PaPopupModule,
    PaExpanderModule,
    PaTooltipModule,
    ActivityLogTableComponent,
    InfoCardComponent,
    ActivityDownloadComponent,
  ],
  exports: [],
})
export class ActivityModule {}
