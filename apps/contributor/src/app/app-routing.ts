import { ExtraOptions, Routes } from '@angular/router';
import {
  BaseComponent,
  DashboardLayoutComponent,
  EmptyComponent,
  PageNotFoundComponent,
  RootGuard,
  SelectAccountComponent,
  SelectKbComponent,
} from '@flaps/common';

export const routerOptions: ExtraOptions = {
  initialNavigation: 'enabledBlocking',
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
            component: EmptyComponent,
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
