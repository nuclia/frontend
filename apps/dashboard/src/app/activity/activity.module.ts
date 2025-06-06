import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { RouterModule } from '@angular/router';

import {
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaPopupModule,
  PaTabsModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { ActivityDownloadComponent } from './activity-download.component';
import { ActivityLogTableComponent } from './log-table.component';
import { InfoCardComponent, SisProgressModule } from '@nuclia/sistema';

const ROUTES = [
  {
    path: 'download',
    component: ActivityDownloadComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    RouterModule.forChild(ROUTES),
    PaButtonModule,
    PaTabsModule,
    PaIconModule,
    PaPopupModule,
    PaExpanderModule,
    PaTooltipModule,
    ActivityLogTableComponent,
    InfoCardComponent,
    SisProgressModule,
  ],
  declarations: [ActivityDownloadComponent],
  exports: [],
})
export class ActivityModule {}
