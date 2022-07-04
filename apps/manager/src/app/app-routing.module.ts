import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoggedinGuard } from '@flaps/core';
import { environment } from '../environments/environment';
import { SelectivePreloadingStrategyService } from './selective-preloading-strategy.service';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [LoggedinGuard],
    children: [
      {
        path: '',
        canActivate: [LoggedinGuard],
        loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
        data: { preload: false },
      },
      {
        path: 'users',
        canActivate: [LoggedinGuard],
        loadChildren: () => import('./users/users.module').then((m) => m.UsersModule),
        data: { preload: false },
      },
      {
        path: 'dealers',
        canActivate: [LoggedinGuard],
        loadChildren: () => import('./dealer/dealer.module').then((m) => m.DealerModule),
        data: { preload: false },
      },
      {
        path: 'accounts',
        canActivate: [LoggedinGuard],
        loadChildren: () => import('./account/account.module').then((m) => m.AccountModule),
        data: { preload: false },
      },
      {
        path: 'zones',
        canActivate: [LoggedinGuard],
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
      enableTracing: !environment.production,
      preloadingStrategy: SelectivePreloadingStrategyService,
      relativeLinkResolution: 'legacy',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
