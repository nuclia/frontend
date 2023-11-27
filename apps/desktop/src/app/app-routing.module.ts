import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SelectAccountComponent } from './account/account.component';

const routes: Routes = [
  {
    path: '',
    // eslint-disable-next-line @nx/enforce-module-boundaries
    loadChildren: () => import('../../../../libs/sync/src/lib/sync.module').then((m) => m.SyncModule),
  },
  {
    path: 'select',
    component: SelectAccountComponent,
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
