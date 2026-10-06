import { Routes } from '@angular/router';
import { RESOURCE_ROUTES } from '../resources';
import { DataPageComponent } from './data-page/data-page.component';
import { DataComponent } from './data.component';

export const DATA_ROUTES: Routes = [
  {
    path: '',
    component: DataComponent,
    children: [
      {
        path: '',
        component: DataPageComponent,
        children: [
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
    ],
  },
];
