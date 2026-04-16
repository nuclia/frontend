import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  aragOwnerGuard,
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  PageNotFoundComponent,
  PageNotFoundModule,
  rootGuard,
  SelectAccountComponent,
  selectAccountGuard,
  SelectKbComponent,
  selectKbGuard,
  setAccountGuard,
  awsGuard,
  AwsOnboardingComponent,
  KnowledgeBoxKeysComponent,
  KnowledgeBoxUsersComponent,
  ProfileComponent,
  OnboardingComponent,
} from '@flaps/common';
import {
  RedirectComponent,
  FarewellComponent,
  FeedbackComponent,
  CallbackComponent,
  AppLoginComponent,
} from '@nuclia/user';
import { authGuard, redirectToSignUp } from '@flaps/core';
import { HomeComponent } from './home/home.component';
import { PlatformComponent } from './platform.component';
import { RandomComponent } from './random/random.component';

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
        path: `at/:account`,
        component: DashboardLayoutComponent,
        canActivate: [setAccountGuard],
        children: [
          {
            path: '',
            redirectTo: 'manage',
            pathMatch: 'full',
          },
          {
            path: `manage`,
            loadChildren: () =>
              // eslint-disable-next-line @nx/enforce-module-boundaries
              import('../../../../libs/common/src/lib/account/account.module').then((m) => m.AccountModule),
          },
          {
            path: 'platform',
            component: PlatformComponent,
            children: [
              {
                path: '',
                component: HomeComponent,
              },
              {
                path: 'random',
                component: RandomComponent,
              },
            ],
          },
        ],
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
        component: SelectKbComponent,
        canActivate: [selectKbGuard],
      },
    ],
  },
  {
    path: 'feedback',
    component: FeedbackComponent,
    canActivate: [authGuard],
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
  {
    path: 'user/profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  { path: 'user/callback', component: CallbackComponent },
  { path: 'user/login-redirect', component: AppLoginComponent },
  { path: 'user/signup', component: PageNotFoundComponent, canActivate: [redirectToSignUp] },
  { path: 'user/onboarding', component: OnboardingComponent },
  { path: '**', component: PageNotFoundComponent },
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
