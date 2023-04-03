import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';

import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { AccountListComponent } from './account-list/account-list.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { AccountsResolve } from '../resolvers/accounts.resolver';
import { AccountResolve } from '../resolvers/account.resolver';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatExpansionModule } from '@angular/material/expansion';
import { StashResolve } from '../resolvers/stash.resolver';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { StashDetailComponent } from './stash-detail/stash-detail.component';
import { AccountBaseComponent } from './account-base/account-base.component';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { STFInputModule } from '../inputfield/input-module';

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
    MatTabsModule,
    FlexLayoutModule,
    RouterModule.forChild(homeRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
  ],
  exports: [RouterModule],
})
export class AccountModule {}
