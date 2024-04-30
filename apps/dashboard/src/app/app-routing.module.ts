import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

import {
  accountOwnerGuard,
  AiModelsComponent,
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  knowledgeBoxOwnerGuard,
  KnowledgeBoxSettingsComponent,
  PageNotFoundComponent,
  PageNotFoundModule,
  PromptLabComponent,
  rootGuard,
  SearchComponent,
  SelectAccountComponent,
  selectAccountGuard,
  SelectKbComponent,
  selectKbGuard,
  setAccountGuard,
  setKbGuard,
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
import { inviteGuard } from './onboarding/invite/invite.guard';
import { InviteComponent } from './onboarding/invite/invite.component';
import { FeedbackComponent } from './farewell/feedback.component';
import { AwsOnboardingComponent } from './onboarding/aws-onboarding/aws-onboarding.component';
import { awsGuard } from './onboarding/aws-onboarding/aws.guard';

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
        canActivate: [setAccountGuard],
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
          // backward compatibility with old urls
          {
            path: ':kb',
            redirectTo: '/select',
            pathMatch: 'full',
          },
          {
            path: `:zone/:kb`,
            component: KnowledgeBoxComponent,
            canActivate: [setKbGuard],
            children: [
              {
                path: '',
                component: KnowledgeBoxHomeComponent,
                resolve: {},
              },
              {
                path: 'upload',
                loadChildren: () =>
                  import('../../../../libs/common/src/lib/upload/upload.module').then((m) => m.UploadModule),
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
                path: 'sync',
                // eslint-disable-next-line @nx/enforce-module-boundaries
                loadChildren: () => import('../../../../libs/sync/src/lib/sync.routes').then((m) => m.SYNC_ROUTES),
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
                  import('../../../../libs/core/src/lib/label/label-sets/label-sets.module').then(
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
                path: 'ai-models',
                component: AiModelsComponent,
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
                  import('../../../../libs/common/src/lib/search-widget/widgets/widgets.module').then(
                    (m) => m.WidgetsModule,
                  ),
              },
              {
                path: 'prompt-lab',
                component: PromptLabComponent,
              },
              {
                path: 'tasks',
                loadChildren: () =>
                  import('../../../../libs/common/src/lib/tasks-automation/tasks-automation.routes').then(
                    (m) => m.TASK_AUTOMATION_ROUTES,
                  ),
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
    canActivate: [authGuard, selectAccountGuard],
    children: [
      {
        path: ':account',
        component: SelectKbComponent,
        canActivate: [selectKbGuard],
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
    path: 'setup_account',
    component: AwsOnboardingComponent,
    canActivate: [awsGuard],
  },
  {
    path: 'user',
    loadChildren: () => import('./lazy-user.module').then((m) => m.LazyUserModule),
  },
  { path: '**', component: PageNotFoundComponent },
];

const routerOptions: ExtraOptions = {
  scrollPositionRestoration: 'enabled',
  paramsInheritanceStrategy: 'always',
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions), PageNotFoundModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
