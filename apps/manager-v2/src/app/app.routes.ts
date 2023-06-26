import { Route } from '@angular/router';
import { authGuard } from '@flaps/core';
import { AppLayoutComponent } from './app-layout/app-layout.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'accounts',
        pathMatch: 'full',
      },
      {
        path: 'accounts',
        canActivate: [authGuard],
        loadChildren: () => import('./manage-accounts/manage-accounts.module').then((m) => m.ManageAccountsModule),
      },
      {
        path: 'users',
        canActivate: [authGuard],
        loadChildren: () => import('./manage-users/manage-users.module').then((m) => m.ManageUsersModule),
      },
    ],
  },
  {
    path: 'user',
    // eslint-disable-next-line @nx/enforce-module-boundaries
    loadChildren: () => import('../../../../libs/common/src/lib/user/user.module').then((m) => m.UserModule),
  },
];
