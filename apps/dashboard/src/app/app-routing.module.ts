import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

import {
  accountOwnerGuard,
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  knowledgeBoxOwnerGuard,
  KnowledgeBoxSettingsComponent,
  PageNotFoundComponent,
  PageNotFoundModule,
  rootGuard,
  SearchComponent,
  SelectAccountComponent,
  selectAccountKbGuard,
  SelectKbComponent,
} from '@flaps/common';
import { authGuard } from '@flaps/core';
import { AccountManageComponent } from './account/account-manage/account-manage.component';
import { FarewellComponent } from './farewell/farewell.component';

import { AccountKbsComponent } from './account/account-kbs/account-kbs.component';
import { AccountHomeComponent } from './account/account-home/account-home.component';
import { RedirectComponent } from './redirect/redirect.component';
import { AccountNUAComponent } from './account/account-nua/account-nua.component';
import { NuaActivityComponent } from './account/account-nua/nua-activity/nua-activity.component';
import { AccountUsersComponent } from './account/account-users/account-users.component';
import {
  KnowledgeBoxComponent,
  KnowledgeBoxHomeComponent,
  KnowledgeBoxKeysComponent,
  KnowledgeBoxUsersComponent,
} from './knowledge-box';
import { inviteGuard } from './invite/invite.guard';
import { InviteComponent } from './invite/invite.component';
import { FeedbackComponent } from './farewell/feedback.component';

const routes: Routes = [
  {
    path: '',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [rootGuard],
      },
      {
        path: 'redirect',
        component: RedirectComponent,
      },
      {
        path: `at/:account`,
        component: DashboardLayoutComponent,
        children: [
          {
            path: '',
            redirectTo: 'manage',
            pathMatch: 'full',
          },
          {
            path: `manage`,
            children: [
              {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full',
              },
              {
                path: 'settings',
                component: AccountManageComponent,
                canActivate: [accountOwnerGuard],
              },
              {
                path: 'home',
                component: AccountHomeComponent,
                canActivate: [accountOwnerGuard],
              },
              {
                path: 'nua',
                component: AccountNUAComponent,
                canActivate: [accountOwnerGuard],
              },
              {
                path: 'nua/:id/activity',
                component: NuaActivityComponent,
                canActivate: [accountOwnerGuard],
              },
              {
                path: 'kbs',
                component: AccountKbsComponent,
                canActivate: [accountOwnerGuard],
              },
              {
                path: 'users',
                component: AccountUsersComponent,
                canActivate: [accountOwnerGuard],
              },
              {
                path: 'billing',
                loadChildren: () => import('./account/billing/billing.module').then((m) => m.BillingModule),
              },
            ],
          },
          {
            path: `:stash`,
            component: KnowledgeBoxComponent,
            children: [
              {
                path: '',
                component: KnowledgeBoxHomeComponent,
                resolve: {},
              },
              {
                path: 'resources',
                loadChildren: () =>
                  import('../../../../libs/common/src/lib/resources/resources.module').then((m) => m.ResourcesModule),
              },
              {
                path: 'search',
                component: SearchComponent,
              },
              {
                path: 'activity',
                loadChildren: () => import('./activity/activity.module').then((m) => m.ActivityModule),
              },
              {
                path: 'entities',
                // eslint-disable-next-line @nx/enforce-module-boundaries
                loadChildren: () =>
                  import('../../../../libs/common/src/lib/entities/entities.module').then((m) => m.EntitiesModule),
              },
              {
                path: 'label-sets',
                loadChildren: () =>
                  import('../../../../libs/common/src/lib/label/label-sets/label-sets.module').then(
                    (m) => m.LabelSetsModule,
                  ),
              },
              {
                path: 'synonyms',
                loadChildren: () => import('./synonyms/synonyms.module').then((m) => m.SynonymsModule),
              },
              {
                path: 'manage',
                component: KnowledgeBoxSettingsComponent,
              },
              {
                path: 'training',
                loadChildren: () =>
                  import('./knowledge-box/knowledge-box-training/knowledge-box-training.module').then(
                    (m) => m.KnowledgeBoxTrainingModule,
                  ),
              },
              {
                path: 'users',
                component: KnowledgeBoxUsersComponent,
                canActivate: [accountOwnerGuard],
              },
              {
                path: 'keys',
                component: KnowledgeBoxKeysComponent,
                canActivate: [knowledgeBoxOwnerGuard],
              },
              {
                path: 'widget-generator',
                loadChildren: () =>
                  import('../../../../libs/common/src/lib/widgets/widgets.module').then((m) => m.WidgetsModule),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'select',
    component: SelectAccountComponent,
    canActivate: [authGuard, selectAccountKbGuard],
    children: [
      {
        path: ':account',
        component: SelectKbComponent,
      },
    ],
  },
  {
    path: 'feedback',
    component: FeedbackComponent,
    canActivate: [authGuard],
  },
  {
    path: 'farewell',
    component: FarewellComponent,
  },
  {
    path: 'setup/invite',
    component: InviteComponent,
    canActivate: [authGuard, inviteGuard],
  },
  {
    path: 'user',
    loadChildren: () => import('./lazy-user.module').then((m) => m.LazyUserModule),
  },
  { path: '**', component: PageNotFoundComponent },
];

const routerOptions: ExtraOptions = {
  scrollPositionRestoration: 'enabled',
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions), PageNotFoundModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
