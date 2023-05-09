import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManageAccountsComponent } from './manage-accounts.component';
import { RouterModule, Routes } from '@angular/router';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { AccountDetailsComponent } from './account-details/account-details.component';
import { AccountListComponent } from './account-list/account-list.component';
import { ConfigurationComponent } from './account-details/configuration/configuration.component';
import { KnowledgeBoxesComponent } from './account-details/knowledge-boxes/knowledge-boxes.component';
import { LimitsComponent } from './account-details/limits/limits.component';
import { UsersComponent } from './account-details/users/users.component';
import { KbDetailsComponent } from './account-details/kb-details/kb-details.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BlockedFeaturesComponent } from './account-details/blocked-features/blocked-features.component';
import { FormFooterComponent } from './form-footer/form-footer.component';

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
        path: ':accountId',
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
            path: 'features',
            component: BlockedFeaturesComponent,
          },
          {
            path: 'kbs',
            component: KnowledgeBoxesComponent,
          },
          {
            path: 'kb/:kbId',
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
    PaTogglesModule,
    ReactiveFormsModule,
    FormsModule,
    PaPopupModule,
    PaDropdownModule,
    PaScrollModule,
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
    BlockedFeaturesComponent,
    FormFooterComponent,
  ],
})
export class ManageAccountsModule {}
