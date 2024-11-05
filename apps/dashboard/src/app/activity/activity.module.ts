import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { RouterModule } from '@angular/router';

import { PaButtonModule, PaIconModule, PaPopupModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { ActivityDownloadComponent } from './activity-download.component';

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
  ],
  declarations: [ActivityDownloadComponent],
  exports: [],
})
export class ActivityModule {}
