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
  inviteInProgressGuard,
  knowledgeBoxOwnerGuard,
  KnowledgeBoxSettingsComponent,
  PageNotFoundComponent,
  PageNotFoundModule,
  PreviewComponent,
  RagLabPageComponent,
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
  setKbGuard,
  simpleModeGuard,
  awsGuard,
  AwsOnboardingComponent,
  KnowledgeBoxKeysComponent,
  KnowledgeBoxUsersComponent,
  ProfileComponent,
  OnboardingComponent,
  WorkflowsListComponent,
  WorkflowsComponent,
} from '@flaps/common';
import {
  RedirectComponent,
  FarewellComponent,
  FeedbackComponent,
  CallbackComponent,
  SetPasswordComponent,
  AppLoginComponent,
  TestingAppSignupComponent,
  TemporaryContextBoxSignupComponent,
} from '@nuclia/user';

import { authGuard, redirectToSignUp } from '@flaps/core';
import { KnowledgeBoxComponent, KnowledgeBoxHomeComponent } from './knowledge-box';

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
            loadChildren: () => import('./app-routing.lazy').then((m) => m.AccountModule),
          },
          {
            path: `:zone/:kb`,
            component: KnowledgeBoxComponent,
            canActivate: [setKbGuard],
            children: [
              {
                path: '',
                component: KnowledgeBoxHomeComponent,
                canActivate: [simpleModeGuard],
                resolve: {},
              },
              {
                path: 'simple',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.SimplePageModule),
              },
              {
                path: 'upload',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.UploadModule),
              },
              {
                path: 'resources',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.ResourcesModule),
              },
              {
                path: 'search',
                component: SearchPageComponent,
              },
              {
                path: 'sync',
                // eslint-disable-next-line @nx/enforce-module-boundaries
                loadChildren: () => import('../../../../libs/sync/src/lib/sync.routes').then((m) => m.SYNC_ROUTES),
              },
              {
                path: 'metrics',
                canActivate: [knowledgeBoxOwnerGuard],
                loadChildren: () => import('./app-routing.lazy').then((m) => m.MetricsModule),
              },
              {
                path: 'entities',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.EntitiesModule),
              },
              {
                path: 'label-sets',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.LabelSetsModule),
              },
              {
                path: 'manage',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.KbSettingsModule),
                canActivate: [knowledgeBoxOwnerGuard],
              },
              {
                path: 'ai-models',
                component: AiModelsComponent,
                canActivate: [knowledgeBoxOwnerGuard],
              },
              {
                path: 'users',
                component: KnowledgeBoxUsersComponent,
                canActivate: [knowledgeBoxOwnerGuard],
                canDeactivate: [inviteInProgressGuard],
              },
              {
                path: 'keys',
                component: KnowledgeBoxKeysComponent,
                canActivate: [knowledgeBoxOwnerGuard],
              },
              {
                path: 'widgets',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.WIDGETS_ROUTES),
                canActivate: [knowledgeBoxOwnerGuard],
              },
              {
                path: 'rag-lab',
                component: RagLabPageComponent,
              },
              {
                path: 'prompt-lab',
                redirectTo: 'rag-lab',
              },
              {
                path: 'tasks',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.TASK_AUTOMATION_ROUTES),
              },
            ],
          },
          {
            path: ':zone/arag/:agent',
            component: RetrievalAgentComponent,
            canActivate: [setAgentGuard],
            children: [
              {
                path: '',
                redirectTo: 'workflows',
                pathMatch: 'full',
              },
              {
                path: 'workflows',
                component: WorkflowsComponent,
                children: [
                  {
                    path: '',
                    component: WorkflowsListComponent,
                  },
                  {
                    path: ':id',
                    component: AgentDashboardComponent,
                  },
                ],
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
                path: 'sources',
                component: DriversPageComponent,
              },
              {
                path: 'search',
                component: SearchPageComponent,
              },
              {
                path: 'widgets',
                loadChildren: () => import('./app-routing.lazy').then((m) => m.WIDGETS_ROUTES),
                canActivate: [aragOwnerGuard],
              },
              {
                path: 'manage',
                component: KnowledgeBoxSettingsComponent,
                canActivate: [aragOwnerGuard],
              },
              {
                path: 'users',
                component: KnowledgeBoxUsersComponent,
                canActivate: [aragOwnerGuard],
                canDeactivate: [inviteInProgressGuard],
              },
              {
                path: 'keys',
                component: KnowledgeBoxKeysComponent,
                canActivate: [aragOwnerGuard],
              },
              {
                path: 'activity',
                component: AgentActivityComponent,
              },
            ],
          },

          // backward compatibility with old urls
          {
            path: ':kb',
            redirectTo: '/select',
            pathMatch: 'full',
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
  // TEMPORARY: expose saml callback for IDP-initiated SAML clients whose RelayState points here.
  // Remove once those clients are updated to use the auth app's URL
  { path: 'user/callbacks/saml', component: CallbackComponent, data: { saml: true } },
  { path: 'user/login-redirect', component: AppLoginComponent },
  { path: 'user/signup', component: PageNotFoundComponent, canActivate: [redirectToSignUp] },
  { path: 'user/test-signup', component: TestingAppSignupComponent },
  { path: 'user/contextbox-signup', component: TemporaryContextBoxSignupComponent },
  { path: 'user/onboarding', component: OnboardingComponent },
  { path: 'user/set-password', component: SetPasswordComponent },
  {
    path: 'user/login',
    redirectTo: '',
    pathMatch: 'full',
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
