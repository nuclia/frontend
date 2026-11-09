import { Routes } from '@angular/router';
import { AccountDetailsComponent } from './account-details/account-details.component';
import { ConfigurationComponent } from './account-details/configuration/configuration.component';
import { ContainersComponent } from './account-details/containers/containers.component';
import { KbDetailsComponent } from './account-details/kb-details/kb-details.component';
import { LimitsComponent } from './account-details/limits/limits.component';
import { AddModelComponent } from './account-details/models/add-model/add-model.component';
import { ModelDetailsComponent } from './account-details/models/model-details/model-details.component';
import { ModelsComponent } from './account-details/models/models.component';
import { PaymentLinksComponent } from './account-details/payment-links/payment-links.component';
import { ProjectDetailsComponent } from './account-details/projects/project-details.component';
import { ProjectListComponent } from './account-details/projects/project-list.component';
import { SubscriptionsComponent } from './account-details/subscriptions/subscriptions.component';
import { TokenConsumptionComponent } from './account-details/token-consumption/token-consumption.component';
import { UsersComponent } from './account-details/users/users.component';
import { AccountListComponent } from './account-list/account-list.component';
import { AddAccountComponent } from './add-account/add-account.component';
import { ManageAccountsComponent } from './manage-accounts.component';

export const MANAGE_ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    component: ManageAccountsComponent,
    children: [
      {
        path: '',
        component: AccountListComponent,
      },
      {
        path: 'add',
        component: AddAccountComponent,
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
            path: 'kbs',
            component: ContainersComponent,
            data: { mode: 'kb' },
          },
          {
            path: 'agents',
            component: ContainersComponent,
            data: { mode: 'agent' },
          },
          {
            path: 'zone/:zoneId/kb/:kbId',
            component: KbDetailsComponent,
          },
          {
            path: 'projects',
            component: ProjectListComponent,
          },
          {
            path: 'zone/:zoneId/project/:projectId',
            component: ProjectDetailsComponent,
          },
          {
            path: 'limits',
            component: LimitsComponent,
          },
          {
            path: 'tokens',
            component: TokenConsumptionComponent,
          },
          {
            path: 'users',
            component: UsersComponent,
          },
          {
            path: 'payment-links',
            component: PaymentLinksComponent,
          },
          {
            path: 'subscriptions',
            component: SubscriptionsComponent,
          },
          {
            path: 'models',
            component: ModelsComponent,
          },
          {
            path: 'models/add',
            component: AddModelComponent,
          },
          {
            path: 'models/:zoneSlug/model/:modelId',
            component: AddModelComponent,
          },
          {
            path: 'models/:zoneSlug/model/:modelId/kbs',
            component: ModelDetailsComponent,
          },
        ],
      },
    ],
  },
];
