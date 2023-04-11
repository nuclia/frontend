import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from '@flaps/core';
import { SelectivePreloadingStrategyService } from './selective-preloading-strategy.service';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [authGuard],
        loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
        data: { preload: false },
      },
      {
        path: 'users',
        canActivate: [authGuard],
        loadChildren: () => import('./users/users.module').then((m) => m.UsersModule),
        data: { preload: false },
      },
      {
        path: 'dealers',
        canActivate: [authGuard],
        loadChildren: () => import('./dealer/dealer.module').then((m) => m.DealerModule),
        data: { preload: false },
      },
      {
        path: 'accounts',
        canActivate: [authGuard],
        loadChildren: () => import('./account/account.module').then((m) => m.AccountModule),
        data: { preload: false },
      },
      {
        path: 'zones',
        canActivate: [authGuard],
        loadChildren: () => import('./zone/zone.module').then((m) => m.ZoneModule),
        data: { preload: false },
      },
    ],
  },
  {
    path: 'user',
    loadChildren: () => import('./lazy-user.module').then((m) => m.LazyUserModule),
    data: { preload: true },
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      enableTracing: false,
      preloadingStrategy: SelectivePreloadingStrategyService,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
