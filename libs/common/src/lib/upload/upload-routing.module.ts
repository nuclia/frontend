import { NgModule } from '@angular/core';
import { UploadDataComponent } from './upload-data/upload-data.component';
import { RouterModule } from '@angular/router';
import { UploadLayoutComponent } from './upload-data/upload-layout.component';

const routes = [
  {
    path: '',
    component: UploadLayoutComponent,
    children: [
      {
        path: '',
        component: UploadDataComponent,
      },
      {
        path: 'sync',
        // eslint-disable-next-line @nx/enforce-module-boundaries
        loadChildren: () => import('../../../../sync/src/lib/new-sync.module').then((m) => m.SyncModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UploadRoutingModule {}
