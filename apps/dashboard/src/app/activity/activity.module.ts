import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { RouterModule } from '@angular/router';

import { ActivityListComponent } from './activity-list.component';
import { PaButtonModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { PipesModule } from '@flaps/common';
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
    PipesModule,
    PaButtonModule,
    PaTabsModule,
  ],
  declarations: [ActivityListComponent, ActivityDownloadComponent],
  exports: [],
})
export class ActivityModule {}
