import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';

import {
  AgentActivityComponent,
  AgentDashboardComponent,
  AiModelsComponent,
  aragOwnerGuard,
  BaseComponent,
  DashboardLayoutComponent,
  DriversPageComponent,
  EditResourceComponent,
  EmptyComponent,
  KnowledgeBoxSettingsComponent,
  PageNotFoundComponent,
  PageNotFoundModule,
  PreviewComponent,
  ResourceFileComponent,
  ResourceLinkComponent,
  ResourceTextComponent,
  RetrievalAgentComponent,
  rootGuard,
  SearchPageComponent,
  SelectAccountComponent,
  selectAccountGuard,
  SelectKbComponent,
  selectKbGuard,
  SessionInfoComponent,
  SessionsComponent,
  SessionsListComponent,
  setAccountGuard,
  setAgentGuard,
  awsGuard,
  AwsOnboardingComponent,
  KnowledgeBoxKeysComponent,
  KnowledgeBoxUsersComponent,
  ProfileComponent,
} from '@flaps/common';
import { RedirectComponent, FarewellComponent, FeedbackComponent, CallbackComponent } from '@nuclia/user';
import { authGuard } from '@flaps/core';

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
            loadChildren: () =>
              import('../../../../libs/common/src/lib/account/account.module').then((m) => m.AccountModule),
          },
          {
            path: ':zone/arag/:agent',
            component: RetrievalAgentComponent,
            canActivate: [setAgentGuard],
            children: [
              {
                path: '',
                component: AgentDashboardComponent,
              },
              {
                path: 'sessions',
                component: SessionsComponent,
                children: [
                  {
                    path: '',
                    component: SessionsListComponent,
                  },
                  {
                    path: ':id/edit',
                    component: EditResourceComponent,
                    data: { mode: 'arag' },
                    children: [
                      {
                        path: '',
                        redirectTo: 'preview',
                        pathMatch: 'full',
                      },
                      {
                        path: 'preview',
                        component: SessionInfoComponent,
                      },
                      {
                        path: 'text/:fieldId',
                        component: ResourceTextComponent,
                      },
                      {
                        path: 'link/:fieldId',
                        component: ResourceLinkComponent,
                      },
                      {
                        path: 'file/:fieldId',
                        component: ResourceFileComponent,
                      },
                      {
                        path: 'preview/:fieldType/:fieldId',
                        component: PreviewComponent,
                      },
                    ],
                  },
                ],
              },
              {
                path: 'drivers',
                component: DriversPageComponent,
              },
              {
                path: 'search',
                component: SearchPageComponent,
              },
              {
                path: 'widgets',
                loadChildren: () =>
                  import('../../../../libs/common/src/lib/search-widget/widgets/widgets.routes').then(
                    (m) => m.WIDGETS_ROUTES,
                  ),
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
                path: 'activity',
                component: AgentActivityComponent,
              },
              {
                path: 'users',
                component: KnowledgeBoxUsersComponent,
                canActivate: [aragOwnerGuard],
              },
              {
                path: 'keys',
                component: KnowledgeBoxKeysComponent,
                canActivate: [aragOwnerGuard],
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
    path: 'setup_account',
    component: AwsOnboardingComponent,
    canActivate: [awsGuard],
  },
  {
    path: 'user/profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  { path: 'user/callback', component: CallbackComponent },
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
