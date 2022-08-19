import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { STFInputModule } from '@flaps/pastanaga';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { ZoneResolve } from '../resolvers/zone.resolver';
import { ZonesResolve } from '../resolvers/zones.resolver';
import { ZoneListComponent } from './zone-list/zone-list.component';
import { ZoneDetailComponent } from './zone-detail/zone-detail.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

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
    MatCardModule,
    MatListModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatTableModule,
    MatInputModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    STFInputModule,
    FlexLayoutModule,
    RouterModule.forChild(usersRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
  ],
  exports: [RouterModule],
})
export class ZoneModule {}
