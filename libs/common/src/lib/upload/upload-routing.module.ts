import { NgModule } from '@angular/core';
import { UploadDataComponent } from './upload-data/upload-data.component';
import { RouterModule } from '@angular/router';

const routes = [
  {
    path: '',
    component: UploadDataComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UploadRoutingModule {}
