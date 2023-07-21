import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { RouterModule } from '@angular/router';

import { ActivityComponent } from './activity.component';
import { ActivityListComponent } from './activity-list.component';
import { PaButtonModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { PipesModule } from '@flaps/common';
import { ActivityDownloadComponent } from './activity-download.component';

const ROUTES = [
  {
    path: '',
    component: ActivityComponent,
  },
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
  declarations: [ActivityComponent, ActivityListComponent, ActivityDownloadComponent],
  exports: [],
})
export class ActivityModule {}
