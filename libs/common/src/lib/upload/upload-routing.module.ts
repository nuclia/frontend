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
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UploadRoutingModule {}
