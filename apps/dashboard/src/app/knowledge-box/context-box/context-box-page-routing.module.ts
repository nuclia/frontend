import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContextBoxPageComponent } from './context-box-page.component';

const routes = [
  {
    path: '',
    component: ContextBoxPageComponent,
  },
  {
    path: ':externalConnectionId',
    component: ContextBoxPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ContextBoxPageRoutingModule {}
