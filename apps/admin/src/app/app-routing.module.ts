import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

import {
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  PageNotFoundComponent,
  PageNotFoundModule,
  rootGuard,
  awsGuard,
  AwsOnboardingComponent,
  SelectAccountComponent,
  selectAccountGuard,
  selectAccountManageGuard,
  setAccountGuard,
} from '@flaps/common';
import { RedirectComponent, FarewellComponent, CallbackComponent, AppLoginComponent } from '@nuclia/user';
import { authGuard, redirectToSignUp } from '@flaps/core';
import { fallbackRedirectGuard } from './fallback-redirect.guard';
import { captureEntryContextGuard } from './capture-entry-context.guard';

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
  { path: 'user/signup', component: PageNotFoundComponent, canActivate: [redirectToSignUp] },
  { path: '**', canActivate: [fallbackRedirectGuard], component: PageNotFoundComponent },
];

const routerOptions: ExtraOptions = {
  scrollPositionRestoration: 'enabled',
  paramsInheritanceStrategy: 'always',
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions), PageNotFoundModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
