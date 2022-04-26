import { STFButtonsModule, STFInputModule } from '@flaps/pastanaga';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { LoggedinGuard } from '@flaps/auth';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AccountListComponent } from './account-list/account-list.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { AccountsResolve } from '../resolvers/accounts.resolver';
import { AccountResolve } from '../resolvers/account.resolver';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { StashResolve } from '../resolvers/stash.resolver';
import { MatTabsModule } from '@angular/material/tabs';
import { StashDetailComponent } from './stash-detail/stash-detail.component';
import { AccountBaseComponent } from './account-base/account-base.component';

const homeRoutes: Routes = [
  {
    path: '',
    canActivateChild: [LoggedinGuard],
    children: [
      {
        path: '',
        component: AccountListComponent,
        resolve: {
          accounts: AccountsResolve,
        },
      },
      {
        path: 'new',
        component: AccountDetailComponent,
      },
      {
        path: ':account',
        component: AccountBaseComponent,
        resolve: {
          account: AccountResolve,
        },
        children: [
          {
            path: '',
            component: AccountDetailComponent,
          },
          {
            path: ':stash',
            component: StashDetailComponent,
            resolve: {
              stash: StashResolve,
            },
          },
        ],
      },
    ],
  },
];

@NgModule({
  declarations: [AccountListComponent, AccountDetailComponent, StashDetailComponent, AccountBaseComponent],
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
    STFInputModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatTooltipModule,
    STFButtonsModule,
    MatTabsModule,
    FlexLayoutModule,
    RouterModule.forChild(homeRoutes),
    TranslateModule.forChild(),
  ],
  exports: [RouterModule],
})
export class AccountModule {}
