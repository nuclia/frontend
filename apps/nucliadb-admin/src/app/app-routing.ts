import { ExtraOptions, Routes } from '@angular/router';

import { HomePageComponent } from './home/home-page.component';
import { MainContainerComponent } from './home/main-container/main-container.component';
import {
  AiModelsComponent,
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  KnowledgeBoxSettingsComponent,
  PageNotFoundComponent,
  rootGuard,
  SearchComponent,
  SelectAccountComponent,
  SelectKbComponent,
  selectKbGuard,
  setAccountGuard,
  setLocalKbGuard,
} from '@flaps/common';

export const routerOptions: ExtraOptions = {
  onSameUrlNavigation: 'reload',
  scrollPositionRestoration: 'enabled',
  paramsInheritanceStrategy: 'always',
  useHash: true,
};

export const routes: Routes = [
  {
    path: '',
    component: BaseComponent,
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [rootGuard],
      },
      {
        path: `at/:account`,
        component: DashboardLayoutComponent,
        canActivate: [setAccountGuard],
        children: [
          {
            path: `:kb`,
            component: MainContainerComponent,
            canActivate: [setLocalKbGuard],
            children: [
              {
                path: '',
                component: HomePageComponent,
                resolve: {},
              },
              {
                path: 'resources',
                loadChildren: () =>
                  // eslint-disable-next-line @nx/enforce-module-boundaries
                  import('../../../../libs/common/src/lib/resources/resources.module').then((m) => m.ResourcesModule),
              },
              {
                path: 'upload',
                loadChildren: () =>
                  // eslint-disable-next-line @nx/enforce-module-boundaries
                  import('../../../../libs/common/src/lib/upload/upload.module').then((m) => m.UploadModule),
              },
              {
                path: 'search',
                component: SearchComponent,
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
                path: 'label-sets',
                loadChildren: () =>
                  // eslint-disable-next-line @nx/enforce-module-boundaries
                  import('../../../../libs/core/src/lib/label/label-sets/label-sets.module').then(
                    (m) => m.LabelSetsModule,
                  ),
              },
              {
                path: 'entities',
                loadChildren: () =>
                  // eslint-disable-next-line @nx/enforce-module-boundaries
                  import('../../../../libs/common/src/lib/entities/entities.module').then((m) => m.EntitiesModule),
              },
              {
                path: 'widget-generator',
                loadChildren: () =>
                  // eslint-disable-next-line @nx/enforce-module-boundaries
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
    children: [
      {
        path: ':account',
        component: SelectKbComponent,
        canActivate: [selectKbGuard],
      },
    ],
  },
  { path: '**', component: PageNotFoundComponent },
];
