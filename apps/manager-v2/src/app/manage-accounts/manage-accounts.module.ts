import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageAccountsComponent } from './manage-accounts.component';
import { RouterModule, Routes } from '@angular/router';

const ROUTES: Routes = [
  {
    path: '',
    component: ManageAccountsComponent,
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(ROUTES)],
  declarations: [ManageAccountsComponent],
})
export class ManageAccountsModule {}
