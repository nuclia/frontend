import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ServerSelectionComponent } from './server-selection/server-selection.component';
import { SyncComponent } from './upload/sync.component';
import { AddSyncComponent } from './upload/add-sync.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'setup/server',
        component: ServerSelectionComponent,
      },
      {
        path: 'add/:connector',
        component: AddSyncComponent,
      },
      {
        path: ':id',
        component: SyncComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SyncRoutingModule {}
