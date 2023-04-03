import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';

import { ZoneResolve } from '../resolvers/zone.resolver';
import { ZonesResolve } from '../resolvers/zones.resolver';
import { ZoneListComponent } from './zone-list/zone-list.component';
import { ZoneDetailComponent } from './zone-detail/zone-detail.component';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { STFInputModule } from '../inputfield/input-module';

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
