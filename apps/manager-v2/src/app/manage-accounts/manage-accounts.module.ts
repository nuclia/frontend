import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageAccountsComponent } from './manage-accounts.component';
import { RouterModule, Routes } from '@angular/router';
import { PaButtonModule, PaIconModule, PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { AccountDetailsComponent } from './account-details/account-details.component';
import { AccountListComponent } from './account-list/account-list.component';
import { ConfigurationComponent } from './account-details/configuration/configuration.component';
import { KnowledgeBoxesComponent } from './account-details/knowledge-boxes/knowledge-boxes.component';
import { LimitsComponent } from './account-details/limits/limits.component';
import { UsersComponent } from './account-details/users/users.component';
import { KbDetailsComponent } from './account-details/kb-details/kb-details.component';

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
        path: ':id',
        component: AccountDetailsComponent,
        children: [
          {
            path: '',
            redirectTo: 'config',
            pathMatch: 'full',
          },
          {
            path: 'config',
            component: ConfigurationComponent,
          },
          {
            path: 'kbs',
            component: KnowledgeBoxesComponent,
          },
          {
            path: 'kb/:id',
            component: KbDetailsComponent,
          },
          {
            path: 'limits',
            component: LimitsComponent,
          },
          {
            path: 'users',
            component: UsersComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ROUTES),
    PaTableModule,
    PaButtonModule,
    PaTextFieldModule,
    PaIconModule,
  ],
  declarations: [
    ManageAccountsComponent,
    AccountDetailsComponent,
    AccountListComponent,
    ConfigurationComponent,
    LimitsComponent,
    UsersComponent,
    KnowledgeBoxesComponent,
    KbDetailsComponent,
  ],
})
export class ManageAccountsModule {}
