import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ServerSelectionComponent } from './server-selection/server-selection.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'server',
        component: ServerSelectionComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SyncRoutingModule {}
