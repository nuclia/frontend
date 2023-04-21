import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageAccountsComponent } from './manage-accounts.component';
import { RouterModule, Routes } from '@angular/router';
import { PaButtonModule, PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { AccountDetailsComponent } from './account-details/account-details.component';
import { AccountListComponent } from './account-list/account-list.component';

const ROUTES: Routes = [
  {
    path: '',
    component: ManageAccountsComponent,
    children: [
      {
        path: '',
        component: AccountListComponent,
      },
      {
        path: ':slug',
        component: AccountDetailsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(ROUTES), PaTableModule, PaButtonModule, PaTextFieldModule],
  declarations: [ManageAccountsComponent, AccountDetailsComponent, AccountListComponent],
})
export class ManageAccountsModule {}
