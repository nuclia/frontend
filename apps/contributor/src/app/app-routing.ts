import { ExtraOptions, Routes } from '@angular/router';
import {
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  EntitiesComponent,
  PageNotFoundComponent,
  RootGuard,
  SelectAccountComponent,
  SelectKbComponent,
} from '@flaps/common';
import { HomePageComponent } from './home/home-page.component';
import { MainContainerComponent } from './home/main-container/main-container.component';

export const routerOptions: ExtraOptions = {
  onSameUrlNavigation: 'reload',
  scrollPositionRestoration: 'enabled',
};

export const routes: Routes = [
  {
    path: '',
    component: BaseComponent,
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [RootGuard],
      },
      {
        path: `at/:account`,
        component: DashboardLayoutComponent,
        children: [
          {
            path: `:stash`,
            component: MainContainerComponent,
            children: [
              {
                path: '',
                component: HomePageComponent,
                resolve: {},
              },
              {
                path: 'resources',
                loadChildren: () =>
                  // eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
                  import('../../../../libs/common/src/lib/resources/resources.module').then((m) => m.ResourcesModule),
              },
              {
                path: 'entities',
                component: EntitiesComponent,
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
      },
    ],
  },
  { path: '**', component: PageNotFoundComponent },
];
