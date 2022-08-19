import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { RouterModule } from '@angular/router';
import { PipesModule } from '../utils/pipes/pipes.module';

import { ActivityComponent } from './activity.component';
import { ActivityListComponent } from './activity-list.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

const Components = [ActivityComponent, ActivityListComponent];

const ROUTES = [
  {
    path: '',
    component: ActivityComponent,
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
  ],
  declarations: [...Components],
  exports: [],
})
export class ActivityModule {}
