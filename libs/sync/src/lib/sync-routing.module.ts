import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ServerSetupComponent } from './server-selection/server-setup.component';
import { SyncComponent } from './upload/sync.component';
import { AddSyncComponent } from './upload/add-sync.component';

/**
 * @deprecated
 * TODO: cleanup this code
 */
const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'setup/server',
        component: ServerSetupComponent,
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
