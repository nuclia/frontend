import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SelectAccountComponent } from './account/account.component';
import { HistoryComponent } from './history/history.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { UploadComponent } from './upload/upload.component';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'add-upload',
        pathMatch: 'full',
      },
      {
        path: 'add-upload',
        component: UploadComponent,
      },
      {
        path: 'redirect',
        component: UploadComponent,
      },
      {
        path: 'history',
        component: HistoryComponent,
      },
    ],
  },
  {
    path: 'select',
    component: SelectAccountComponent,
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
