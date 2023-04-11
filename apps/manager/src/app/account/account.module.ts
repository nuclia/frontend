import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AccountListComponent } from './account-list/account-list.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { AccountsResolve } from '../resolvers/accounts.resolver';
import { AccountResolve } from '../resolvers/account.resolver';
import { StashResolve } from '../resolvers/stash.resolver';
import { StashDetailComponent } from './stash-detail/stash-detail.component';
import { AccountBaseComponent } from './account-base/account-base.component';
import {
  PaButtonModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisProgressModule } from '@nuclia/sistema';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { FlexLayoutModule } from '@angular/flex-layout';

const homeRoutes: Routes = [
  {
    path: '',
    canActivateChild: [authGuard],
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
    RouterModule.forChild(homeRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaTabsModule,
    SisProgressModule,

    FlexLayoutModule,
    MatTableModule,
    MatSortModule,
    PaTooltipModule,
  ],
  exports: [RouterModule],
})
export class AccountModule {}
