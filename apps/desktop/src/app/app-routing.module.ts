import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFoundComponent } from '@flaps/common';
import { SelectAccountComponent } from './account/account.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { UploadComponent } from './upload/upload.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'add-upload',
        component: UploadComponent,
      },
      {
        path: 'redirect',
        component: UploadComponent,
      },
    ],
  },
  {
    path: 'select',
    component: SelectAccountComponent,
  },
  {
    path: 'user',
    children: [
      { path: 'login', component: LoginComponent },
      { path: '**', redirectTo: 'login' },
    ],
  },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { initialNavigation: 'enabledBlocking' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
