import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ServerSelectionComponent } from './server-selection/server-selection.component';
import { SyncComponent } from './upload/sync.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'server',
        component: ServerSelectionComponent,
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
