import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  accountOwnerGuard,
  ChartsModule,
  HintModule,
  KbCreationComponent,
  KnowledgeBoxSettingsModule,
  NavbarModule,
  PipesModule,
  TokenDialogModule,
} from '@flaps/common';

import { AccountHomeComponent } from './account-home/account-home.component';
import { AccountManageComponent } from './account-manage/account-manage.component';
import { AccountKbsComponent } from './account-kbs/account-kbs.component';
import { UsersDialogComponent } from './account-kbs/users-dialog/users-dialog.component';
import { AccountNUAComponent } from './account-nua/account-nua.component';
import { ClientDialogComponent } from './account-nua/client-dialog/client-dialog.component';
import { AccountUsersComponent } from './account-users/account-users.component';
import { NuaActivityComponent } from './account-nua/nua-activity/nua-activity.component';
import { UsersManageModule } from '../knowledge-box';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaIconModule,
  PaModalModule,
  PaTableModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent, SisProgressModule } from '@nuclia/sistema';
import { AccountDeleteComponent } from './account-manage/account-delete/account-delete.component';
import { AccountStatusComponent } from './account-status/account-status.component';
import { BillingModule } from './billing/billing.module';
import { LowerCaseInputDirective, UnauthorizedFeatureComponent, UnauthorizedFeatureDirective } from '@flaps/core';
import { KbListComponent } from './account-kbs/kb-list/kb-list.component';
import { BillingComponent } from './billing/billing.component';
import { RedirectComponent } from './billing/redirect.component';
import { SubscriptionsComponent } from './billing/subscriptions/subscriptions.component';
import { CheckoutComponent } from './billing/checkout/checkout.component';
import { MySubscriptionComponent } from './billing/my-subscription/my-subscription.component';
import { UsageComponent } from './billing/usage/usage.component';
import { HistoryComponent } from './billing/history/history.component';
import { NucliaTokensComponent } from './nuclia-tokens';
import { AccountRasComponent } from './account-ras/account-ras.component';
import { RaListComponent } from './account-ras/ra-list/ra-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'settings',
    component: AccountManageComponent,
    canActivate: [accountOwnerGuard],
  },
  {
    path: 'home',
    component: AccountHomeComponent,
    canActivate: [accountOwnerGuard],
  },
  {
    path: 'nua',
    component: AccountNUAComponent,
    canActivate: [accountOwnerGuard],
  },
  {
    path: 'nua/:id/activity',
    component: NuaActivityComponent,
    canActivate: [accountOwnerGuard],
  },
  {
    path: 'kbs',
    component: AccountKbsComponent,
    canActivate: [accountOwnerGuard],
    children: [
      {
        path: '',
        component: KbListComponent,
      },
      {
        path: 'create',
        component: KbCreationComponent,
      },
    ],
  },
  {
    path: 'ras',
    component: AccountRasComponent,
    canActivate: [accountOwnerGuard],
    children: [{ path: '', component: RaListComponent }],
  },
  {
    path: 'users',
    component: AccountUsersComponent,
    canActivate: [accountOwnerGuard],
  },
  {
    path: 'billing',
    component: BillingComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: RedirectComponent,
      },
      {
        path: 'subscriptions',
        component: SubscriptionsComponent,
      },
      {
        path: 'checkout',
        component: CheckoutComponent,
      },
      {
        path: 'my-subscription',
        component: MySubscriptionComponent,
      },
      {
        path: 'usage',
        component: UsageComponent,
      },
      {
        path: 'history',
        component: HistoryComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    OverlayModule,
    PipesModule,
    TokenDialogModule,
    ChartsModule,
    NavbarModule,
    UsersManageModule,
    HintModule,
    PaButtonModule,
    PaTooltipModule,
    PaModalModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaIconModule,
    DropdownButtonComponent,
    PaDropdownModule,
    SisProgressModule,
    PaTableModule,
    PaTabsModule,
    BillingModule,
    AccountStatusComponent,
    PaDateTimeModule,
    KnowledgeBoxSettingsModule,
    PaTooltipModule,
    UnauthorizedFeatureComponent,
    UnauthorizedFeatureDirective,
    NucliaTokensComponent,
    LowerCaseInputDirective,
  ],
  declarations: [
    AccountHomeComponent,
    AccountManageComponent,
    AccountKbsComponent,
    AccountRasComponent,
    UsersDialogComponent,
    AccountNUAComponent,
    ClientDialogComponent,
    AccountUsersComponent,
    AccountDeleteComponent,
    NuaActivityComponent,
  ],
  exports: [AccountHomeComponent, AccountManageComponent],
})
export class AccountModule {}
