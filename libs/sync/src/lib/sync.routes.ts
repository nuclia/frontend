import { Routes } from '@angular/router';
import { SyncRootComponent } from './sync-root.component';
import { HomePageComponent } from './home-page';
import { AddSyncPageComponent } from './add-sync-page';
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
        path: ':syncId/edit',
        component: AddSyncPageComponent,
      },
      {
        path: ':syncId',
        component: SyncDetailsPageComponent,
      },
    ],
  },
];
