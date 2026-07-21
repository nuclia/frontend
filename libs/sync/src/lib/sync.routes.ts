import { Routes } from '@angular/router';
import { SyncRootComponent } from './sync-root.component';
import { HomePageComponent } from './home-page';
import { AddSyncPageComponent } from './add-sync-page';
import { AddSourcePageComponent } from './add-source-page';
import { SyncDetailsPageComponent } from './sync-details-page';
import { SynchronizeComponent } from './home-page/synchronize';
import { ConnectComponent } from './home-page/connect';

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
