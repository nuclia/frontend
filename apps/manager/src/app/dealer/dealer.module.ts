import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DealerListComponent } from './dealer-list/dealer-list.component';
import { DealerDetailComponent } from './dealer-detail/dealer-detail.component';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatIconModule } from '@angular/material/icon';

import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { DealersResolve } from '../resolvers/dealers.resolver';
import { DealerResolve } from '../resolvers/dealer.resolver';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { STFInputModule } from '../inputfield/input-module';
import { SisProgressModule } from '@nuclia/sistema';

const usersRoutes: Routes = [
  {
    path: '',
    canActivateChild: [LoggedinGuard],
    children: [
      {
        path: '',
        component: DealerListComponent,
        resolve: {
          dealers: DealersResolve,
        },
      },
      {
        path: 'new',
        component: DealerDetailComponent,
      },
      {
        path: ':dealer',
        component: DealerDetailComponent,
        resolve: {
          dealer: DealerResolve,
        },
      },
    ],
  },
];

@NgModule({
  declarations: [DealerListComponent, DealerDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatIconModule,
    STFInputModule,
    FlexLayoutModule,
    RouterModule.forChild(usersRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    SisProgressModule,
  ],
  exports: [RouterModule],
})
export class DealerModule {}
