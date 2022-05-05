import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoggedinGuard } from '@flaps/auth';
import { PageNotFoundComponent } from '@flaps/common';
import { ConnectorsComponent } from './connectors/connectors.component';
import { HomeComponent } from './home/home.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { SourceComponent } from './source/source.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [LoggedinGuard],
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'connectors',
        component: ConnectorsComponent,
        data: {
          hideLeftMenu: true,
        },
      },
      {
        path: 'source/:id',
        component: SourceComponent,
      },
      {
        path: 'redirect',
        component: SourceComponent,
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
  imports: [RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
