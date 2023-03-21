import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

import {
  AccountOwnerGuard,
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  PageNotFoundComponent,
  PageNotFoundModule,
  RootGuard,
  SelectAccountComponent,
  SelectAccountKbGuard,
  SelectKbComponent,
} from '@flaps/common';
import { LoggedinGuard } from '@flaps/core';
import { AccountManageComponent } from './account/account-manage/account-manage.component';
import { SetupStep1Component } from './setup/setup-step1/setup-step1.component';
import { SetupStep2Component } from './setup/setup-step2/setup-step2.component';
import { SetupInviteComponent } from './setup/setup-invite/setup-invite.component';
import { SetupAccountComponent } from './setup/setup-account/setup-account.component';
import { FarewellComponent } from './setup/farewell/farewell.component';

import { AccountKbsComponent } from './account/account-kbs/account-kbs.component';
import { InviteGuard } from './setup/setup-invite/invite.guard';
import { AccountHomeComponent } from './account/account-home/account-home.component';
import { RedirectComponent } from './redirect/redirect.component';
import { AccountNUAComponent } from './account/account-nua/account-nua.component';
import { NuaActivityComponent } from './account/account-nua/nua-activity/nua-activity.component';
import { AccountUsersComponent } from './account/account-users/account-users.component';
import { SearchComponent } from './search/search.component';
import {
  KnowledgeBoxComponent,
  KnowledgeBoxHomeComponent,
  KnowledgeBoxKeysComponent,
  KnowledgeBoxProfileComponent,
  KnowledgeBoxUsersComponent,
} from './knowledge-box';

const routes: Routes = [
  {
    path: '',
    component: BaseComponent,
    canActivate: [LoggedinGuard],
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [RootGuard],
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
                canActivate: [AccountOwnerGuard],
              },
              {
                path: 'home',
                component: AccountHomeComponent,
                canActivate: [AccountOwnerGuard],
              },
              {
                path: 'nua',
                component: AccountNUAComponent,
                canActivate: [AccountOwnerGuard],
              },
              {
                path: 'nua/:id/activity',
                component: NuaActivityComponent,
                canActivate: [AccountOwnerGuard],
              },
              {
                path: 'kbs',
                component: AccountKbsComponent,
                canActivate: [AccountOwnerGuard],
              },
              {
                path: 'users',
                component: AccountUsersComponent,
                canActivate: [AccountOwnerGuard],
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
                // eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
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
                component: KnowledgeBoxProfileComponent,
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
                canActivate: [AccountOwnerGuard],
              },
              {
                path: 'keys',
                component: KnowledgeBoxKeysComponent,
                canActivate: [AccountOwnerGuard],
              },
              {
                path: 'widget-generator',
                loadChildren: () => import('./widgets/widgets.module').then((m) => m.WidgetsModule),
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
    canActivate: [LoggedinGuard, SelectAccountKbGuard],
    children: [
      {
        path: ':account',
        component: SelectKbComponent,
      },
    ],
  },
  {
    path: 'setup/password',
    component: SetupStep1Component,
    canActivate: [LoggedinGuard],
  },
  {
    path: 'setup/account',
    component: SetupStep2Component,
    canActivate: [LoggedinGuard],
  },
  {
    path: 'setup/invite',
    component: SetupInviteComponent,
    canActivate: [LoggedinGuard, InviteGuard],
  },
  {
    path: 'setup/account-config',
    component: SetupAccountComponent,
    canActivate: [LoggedinGuard],
  },
  {
    path: 'setup/farewell',
    component: FarewellComponent,
  },
  {
    path: 'user',
    loadChildren: () => import('./lazy-user.module').then((m) => m.LazyUserModule),
  },
  { path: '**', component: PageNotFoundComponent },
];

const routerOptions: ExtraOptions = {
  onSameUrlNavigation: 'reload',
  scrollPositionRestoration: 'enabled',
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions), PageNotFoundModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
