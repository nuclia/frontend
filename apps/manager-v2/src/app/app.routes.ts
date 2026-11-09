import { Route } from '@angular/router';
import { authGuard } from '@flaps/core';
// import { canSendEmailsGuard } from './manage-emails/can-send-emails.guard';
import { AppLayoutComponent } from './app-layout/app-layout.component';
import { AppLoginComponent, CallbackComponent } from '@nuclia/user';
import { provideUserCallback } from './user-callback/user-callback.providers';

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
        loadChildren: () => import('./manage-accounts/manage-accounts.routes').then((m) => m.MANAGE_ACCOUNTS_ROUTES),
      },
      {
        path: 'users',
        canActivate: [authGuard],
        loadChildren: () => import('./manage-users/manage-users.routes').then((m) => m.MANAGE_USERS_ROUTES),
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
        loadChildren: () => import('./manage-zones/manage-zones.routes').then((m) => m.MANAGE_ZONES_ROUTES),
      },
    ],
  },
  { path: 'user/callback', component: CallbackComponent, providers: [provideUserCallback()] },
  { path: 'user/login-redirect', component: AppLoginComponent },
];
