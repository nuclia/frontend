import { Routes } from '@angular/router';
import { SyncRootComponent } from './sync-root.component';
import { HomePageComponent } from './home-page/home-page.component';

export const SYNC_ROUTES: Routes = [
  {
    path: '',
    component: SyncRootComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
      },
    ],
  },
];
