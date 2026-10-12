import { Routes } from '@angular/router';
import { RESOURCE_ROUTES } from '../resources';
import { DataPageComponent } from './data-page/data-page.component';

export const DATA_ROUTES: Routes = [
  {
    path: '',
    component: DataPageComponent,
    children: [
      {
        path: '',
        redirectTo: 'resources',
        pathMatch: 'full',
      },
      {
        path: 'resources',
        loadChildren: () => RESOURCE_ROUTES,
      },
      {
        path: 'sync',
        loadChildren: () => import('./sync-lazy').then((m) => m.SYNC_ROUTES),
      },
    ],
  },
];
