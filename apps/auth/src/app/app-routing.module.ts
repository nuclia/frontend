import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

import {
  awsGuard,
  AwsOnboardingComponent,
  BaseComponent,
  EmptyComponent,
  PageNotFoundComponent,
  rootGuard,
} from '@flaps/common';
import { authGuard } from '@flaps/core';
import { FarewellComponent, FeedbackComponent, InviteComponent, RedirectComponent } from '@nuclia/user';
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
    path: 'setup/invite',
    component: InviteComponent,
    canActivate: [authGuard],
  },
  {
    path: 'setup_account',
    component: AwsOnboardingComponent,
    canActivate: [awsGuard],
  },
  {
    path: 'user',
    loadChildren: () => import('./lazy-user.module').then((m) => m.LazyUserModule),
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
