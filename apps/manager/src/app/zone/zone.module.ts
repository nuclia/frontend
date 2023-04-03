import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatSortModule } from '@angular/material/sort';

import { ZoneResolve } from '../resolvers/zone.resolver';
import { ZonesResolve } from '../resolvers/zones.resolver';
import { ZoneListComponent } from './zone-list/zone-list.component';
import { ZoneDetailComponent } from './zone-detail/zone-detail.component';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { MatTableModule } from '@angular/material/table';

const usersRoutes: Routes = [
  {
    path: '',
    canActivateChild: [LoggedinGuard],
    children: [
      {
        path: '',
        component: ZoneListComponent,
        resolve: {
          zones: ZonesResolve,
        },
      },
      {
        path: 'new',
        component: ZoneDetailComponent,
      },
      {
        path: ':zone',
        component: ZoneDetailComponent,
        resolve: {
          zone: ZoneResolve,
        },
      },
    ],
  },
];

@NgModule({
  declarations: [ZoneListComponent, ZoneDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSortModule,
    FlexLayoutModule,
    RouterModule.forChild(usersRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    PaTextFieldModule,
    MatTableModule,
  ],
  exports: [RouterModule],
})
export class ZoneModule {}
