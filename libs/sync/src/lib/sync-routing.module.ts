import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';

import { HomeComponent } from './home/home.component';
import { ServerSelectionComponent } from './server-selection/server-selection.component';
import { UploadComponent } from './upload/upload.component';
import { HistoryComponent } from './history/history.component';

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
        path: 'server',
        component: ServerSelectionComponent,
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SyncRoutingModule {}
