import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { LowerCaseInputDirective, UnauthorizedFeatureComponent, UnauthorizedFeatureDirective } from '@flaps/core';
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
import { BackButtonComponent, DropdownButtonComponent, SisProgressModule } from '@nuclia/sistema';
import { UsersManageModule } from '../users-manage';
import { AragListComponent } from './account-arag/arag-list/arag-list.component';
import { AccountBillingComponent } from './account-billing/account-billing.component';
import { AccountAdministrationComponent } from './account-administration/account-administration.component';
import { AccountConfigurationComponent } from './account-configuration/account-configuration.component';
import { AccountHomeComponent } from './account-home/account-home.component';
import { AccountSettingsComponent } from './account-home/account-settings.component';
import { AccountPageLayoutComponent } from './account-page-layout/account-page-layout.component';
import { AccountKbsComponent } from './account-kbs/account-kbs.component';
import { KbListComponent } from './account-kbs/kb-list/kb-list.component';
import { UsersDialogComponent } from './account-kbs/users-dialog/users-dialog.component';
import { AccountDeleteComponent } from './account-manage/account-delete/account-delete.component';
import { OtpInputComponent } from './account-manage/account-delete/otp-input/otp-input.component';
import { AccountManageComponent } from './account-manage/account-manage.component';
import { AccountNUAComponent } from './account-nua/account-nua.component';
import { ClientDialogComponent } from './account-nua/client-dialog/client-dialog.component';
import { NuaActivityComponent } from './account-nua/nua-activity/nua-activity.component';
import { AccountStatusComponent } from './account-status/account-status.component';
import { AccountUsersComponent } from './account-users/account-users.component';
import { SimpleAccountHomeComponent } from './account-home/simple-account-home.component';
import { BillingModule } from './billing/billing.module';
import { CheckoutComponent } from './billing/checkout/checkout.component';
import { HistoryComponent } from './billing/history/history.component';
import { MySubscriptionComponent } from './billing/my-subscription/my-subscription.component';
import { RedirectComponent } from './billing/redirect.component';
import { SubscriptionsComponent } from './billing/subscriptions/subscriptions.component';
import { UsageTableComponent } from './billing/usage/usage-table.component';
import { NucliaTokensComponent } from './nuclia-tokens';
import { AccountModelsComponent } from './account-models/account-models.component';
import { accountOwnerGuard, agentFeatureEnabledGuard, canMatchSimpleMode } from '../guards';
import { KbCreationComponent } from '../kb-creation';
import { PipesModule } from '../pipes';
import { TokenDialogModule } from '../token-dialog';
import { ChartsModule } from '../charts';
import { NavbarModule } from '../navbar';
import { HintModule } from '../hint';
import { ProfileComponent } from '../profile/profile.component';
import { AccountConsumptionComponent } from './account-home/account-consumption.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  // /settings is now a tab — redirect to the account-settings tab
  {
    path: 'settings',
    redirectTo: 'home/account-settings',
  },
  // Simple home (matches when simpleMode is true)
  {
    path: 'home',
    canMatch: [canMatchSimpleMode],
    component: SimpleAccountHomeComponent,
    canActivate: [accountOwnerGuard],
  },
  // Home page — tab shell with child routes
  {
    path: 'home',
    component: AccountSettingsComponent,
    canActivate: [accountOwnerGuard],
    children: [
      { path: '', redirectTo: 'consumption', pathMatch: 'full' },
      { path: 'consumption', component: AccountConsumptionComponent },
      { path: 'preferences', component: ProfileComponent, data: { embedded: true } },
      { path: 'account-settings', component: AccountManageComponent, data: { embedded: true } },
    ],
  },
  // Administration page — tab shell with child routes
  {
    path: 'administration',
    component: AccountAdministrationComponent,
    canActivate: [accountOwnerGuard],
    children: [
      { path: '', redirectTo: 'knowledge-boxes', pathMatch: 'full' },
      { path: 'knowledge-boxes', component: KbListComponent },
      {
        path: 'knowledge-boxes/create',
        component: KbCreationComponent,
        data: { embedded: true },
      },
      { path: 'users', component: AccountUsersComponent },
      { path: 'retrieval-agents', component: AragListComponent, canActivate: [agentFeatureEnabledGuard] },
    ],
  },
  // Configuration page — tab shell with child routes
  {
    path: 'configuration',
    component: AccountConfigurationComponent,
    canActivate: [accountOwnerGuard],
    children: [
      { path: '', redirectTo: 'nua', pathMatch: 'full' },
      { path: 'nua', component: AccountNUAComponent },
      { path: 'nua/:id/activity', component: NuaActivityComponent },
      { path: 'models', component: AccountModelsComponent },
    ],
  },
  // Billing page — tab shell with child routes
  {
    path: 'billing',
    component: AccountBillingComponent,
    canActivate: [accountOwnerGuard],
    children: [
      { path: '', pathMatch: 'full', component: RedirectComponent },
      { path: 'subscriptions', component: SubscriptionsComponent },
      { path: 'checkout', component: CheckoutComponent },
      { path: 'my-subscription', component: MySubscriptionComponent },
      { path: 'usage', component: UsageTableComponent },
      { path: 'history', component: HistoryComponent },
    ],
  },
  // Legacy redirect routes (backward compatibility for bookmarked URLs)
  { path: 'nua', redirectTo: 'configuration/nua' },
  { path: 'nua/:id/activity', redirectTo: ({ params }) => `configuration/nua/${params['id']}/activity` },
  { path: 'kbs', pathMatch: 'full', redirectTo: 'administration/knowledge-boxes' },
  { path: 'kbs/create', pathMatch: 'full', redirectTo: 'administration/knowledge-boxes/create' },
  { path: 'arag', redirectTo: 'administration/retrieval-agents' },
  { path: 'models', redirectTo: 'configuration/models' },
  { path: 'users', redirectTo: 'administration/users' },
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
    BackButtonComponent,
    PaDropdownModule,
    SisProgressModule,
    PaTableModule,
    PaTabsModule,
    BillingModule,
    AccountStatusComponent,
    PaDateTimeModule,
    PaTooltipModule,
    UnauthorizedFeatureComponent,
    UnauthorizedFeatureDirective,
    NucliaTokensComponent,
    LowerCaseInputDirective,
    OtpInputComponent,
    AccountDeleteComponent,
    ProfileComponent,
    AragListComponent,
    AccountModelsComponent,
    KbListComponent,
    KbCreationComponent,
  ],
  declarations: [
    AccountAdministrationComponent,
    AccountBillingComponent,
    AccountHomeComponent,
    AccountPageLayoutComponent,
    AccountConsumptionComponent,
    AccountSettingsComponent,
    AccountManageComponent,
    AccountKbsComponent,
    UsersDialogComponent,
    AccountNUAComponent,
    AccountConfigurationComponent,
    ClientDialogComponent,
    AccountUsersComponent,
    NuaActivityComponent,
    SimpleAccountHomeComponent,
  ],
  exports: [AccountHomeComponent, AccountSettingsComponent, AccountManageComponent, SimpleAccountHomeComponent],
})
export class AccountModule {}
