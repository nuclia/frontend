import { Routes } from '@angular/router';
import { ManageZonesComponent } from './manage-zones.component';
import { ZoneDetailsComponent } from './zone-details/zone-details.component';
import { ZoneListComponent } from './zone-list/zone-list.component';

export const MANAGE_ZONES_ROUTES: Routes = [
  {
    path: '',
    component: ManageZonesComponent,
    children: [
      {
        path: '',
        component: ZoneListComponent,
      },
      {
        path: ':zoneId', // same path used when adding a zone, where the "id" is "add"
        component: ZoneDetailsComponent,
      },
    ],
  },
];
