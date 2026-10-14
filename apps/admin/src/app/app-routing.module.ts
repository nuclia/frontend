import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

import {
  awsGuard,
  AwsOnboardingComponent,
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  PageNotFoundComponent,
  rootGuard,
  SelectAccountComponent,
  selectAccountGuard,
  selectAccountManageGuard,
  setAccountGuard,
} from '@flaps/common';
import { authGuard, redirectToSignUp } from '@flaps/core';
import {
  AppLoginComponent,
  CallbackComponent,
  FarewellComponent,
  RedirectComponent,
  SetPasswordComponent,
  TemporaryContextBoxSignupComponent,
  TestingAppSignupComponent,
} from '@nuclia/user';
import { captureEntryContextGuard } from './capture-entry-context.guard';
import { fallbackRedirectGuard } from './fallback-redirect.guard';

const routes: Routes = [
  {
    path: '',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [rootGuard],
      },
      {
        path: 'redirect',
        component: RedirectComponent,
      },
      {
        // No `/manage` segment here — unlike dashboard, `admin` only has account pages.
        path: 'at/:account',
        component: DashboardLayoutComponent,
        canActivate: [captureEntryContextGuard, setAccountGuard],
        loadChildren: () => import('./account/account.module').then((m) => m.AccountModule),
      },
    ],
  },
  {
    path: 'select',
    component: SelectAccountComponent,
    canActivate: [authGuard, selectAccountGuard],
    children: [
      {
        path: ':account',
        // No component: this route only exists to run the account-selection guard chain, then
        // redirect straight to the account-manage URL (admin has no KB/ARAG picker to show).
        component: EmptyComponent,
        canActivate: [selectAccountManageGuard],
      },
    ],
  },
  {
    path: 'farewell',
    component: FarewellComponent,
  },
  {
    path: 'setup_account',
    component: AwsOnboardingComponent,
    canActivate: [awsGuard],
  },
  { path: 'user/callback', component: CallbackComponent },
  { path: 'user/login-redirect', component: AppLoginComponent },
  // TEMPORARY: expose saml callback for IDP-initiated SAML clients whose RelayState points here.
  // Remove once those clients are updated to use the auth app's URL
  { path: 'user/callbacks/saml', component: CallbackComponent, data: { saml: true } },
  { path: 'user/signup', component: PageNotFoundComponent, canActivate: [redirectToSignUp] },
  { path: 'user/test-signup', component: TestingAppSignupComponent },
  { path: 'user/contextbox-signup', component: TemporaryContextBoxSignupComponent },
  { path: 'user/set-password', component: SetPasswordComponent },
  {
    path: 'user/login',
    redirectTo: '',
    pathMatch: 'full',
  },
  { path: '**', canActivate: [fallbackRedirectGuard], component: PageNotFoundComponent },
];

const routerOptions: ExtraOptions = {
  scrollPositionRestoration: 'enabled',
  paramsInheritanceStrategy: 'always',
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
