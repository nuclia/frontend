import { Routes } from '@angular/router';
import { SyncComponent } from './sync.component';
import { HomePageComponent } from './home-page/home-page.component';

export const SYNC_ROUTES: Routes = [
  {
    path: '',
    component: SyncComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
      },
    ],
  },
];
