import { Routes } from '@angular/router';
import { AddSourcePageComponent } from './add-source-page';
import { AddSyncPageComponent } from './add-sync-page';
import { HomePageComponent } from './home-page';
import { ConnectComponent } from './home-page/connect';
import { SynchronizeComponent } from './home-page/synchronize';
import { SyncDetailsPageComponent } from './sync-details-page';
import { SyncRootComponent } from './sync-root.component';

export const SYNC_ROUTES: Routes = [
  {
    path: '',
    component: SyncRootComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
        children: [
          { path: '', component: SynchronizeComponent },
          { path: 'connect', component: ConnectComponent },
          {
            path: 'resources',
            data: { embedded: true },
            loadChildren: () => import('./resources-lazy').then((m) => m.RESOURCE_ROUTES),
          },
        ],
      },
      {
        path: 'add/:connector',
        component: AddSyncPageComponent,
      },
      {
        path: 'add/:connector/:syncId',
        component: AddSyncPageComponent,
      },
      {
        path: ':syncId/edit',
        component: SyncDetailsPageComponent,
      },
      {
        path: ':syncId',
        component: SyncDetailsPageComponent,
      },
      {
        path: 'add-source/:type',
        component: AddSourcePageComponent,
      },
      {
        path: 'source/:sourceId',
        component: AddSourcePageComponent,
      },
    ],
  },
];
