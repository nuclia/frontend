import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SimplePageComponent } from './simple-page.component';

const routes = [
  {
    path: '',
    component: SimplePageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SimplePageRoutingModule {}
