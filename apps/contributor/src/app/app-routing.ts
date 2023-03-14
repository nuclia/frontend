import { ExtraOptions, Routes } from '@angular/router';
import { BaseComponent, EmptyComponent, PageNotFoundComponent, RootGuard, SelectKbComponent } from '@flaps/common';

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
    ],
  },
  {
    path: 'select',
    component: SelectKbComponent,
  },
  { path: '**', component: PageNotFoundComponent },
];
