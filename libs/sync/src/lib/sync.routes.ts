import { Routes } from '@angular/router';
import { SyncRootComponent } from './sync-root.component';
import { HomePageComponent } from './home-page';
import { AddSyncPageComponent } from './add-sync-page';
import { AddThirdPartyPageComponent } from './add-third-party-page';
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
        path: 'connect-third-party/:appId',
        component: AddThirdPartyPageComponent,
      },
      {
        path: ':syncId/edit',
        component: SyncDetailsPageComponent,
      },
      {
        path: ':syncId',
        component: SyncDetailsPageComponent,
      },
    ],
  },
];
