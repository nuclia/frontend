import { Route } from '@angular/router';
import { authGuard } from '@flaps/core';
// import { canSendEmailsGuard } from './manage-emails/can-send-emails.guard';
import { AppLayoutComponent } from './app-layout/app-layout.component';
import { AppLoginComponent, CallbackComponent } from '@nuclia/user';

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
      // Disabled: waiting for the 'unsubscribe' button from the backend side
      // {
      //   path: 'emails',
      //   canActivate: [authGuard, canSendEmailsGuard],
      //   loadComponent: () => import('./manage-emails/manage-emails.component').then((m) => m.ManageEmailsComponent),
      // },
      {
        path: 'zones',
        canActivate: [authGuard],
        loadChildren: () => import('./manage-zones/manage-zones.module').then((m) => m.ManageZonesModule),
      },
    ],
  },
  { path: 'user/callback', component: CallbackComponent },
  { path: 'user/login-redirect', component: AppLoginComponent },
];
