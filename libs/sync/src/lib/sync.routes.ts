import { Routes } from '@angular/router';
import { SyncRootComponent } from './sync-root.component';
import { HomePageComponent } from './home-page';
import { AddSyncPageComponent } from './add-sync-page';
import { AddSourcePageComponent } from './add-source-page';
import { SyncDetailsPageComponent } from './sync-details-page';

export const SYNC_ROUTES: Routes = [
  {
    path: '',
    component: SyncRootComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
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
