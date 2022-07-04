import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DealerListComponent } from './dealer-list/dealer-list.component';
import { DealerDetailComponent } from './dealer-detail/dealer-detail.component';
import { Routes, RouterModule } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DealersResolve } from '../resolvers/dealers.resolver';
import { DealerResolve } from '../resolvers/dealer.resolver';
import { STFInputModule, STFButtonsModule } from '@flaps/pastanaga';

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
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatIconModule,
    STFInputModule,
    STFButtonsModule,
    FlexLayoutModule,
    RouterModule.forChild(usersRoutes),
    TranslateModule.forChild(),
  ],
  exports: [RouterModule],
})
export class DealerModule {}
