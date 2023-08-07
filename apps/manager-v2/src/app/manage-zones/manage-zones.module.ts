import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import {
  PaButtonModule,
  PaIconModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { ManageZonesComponent } from './manage-zones.component';
import { ZoneListComponent } from './zone-list/zone-list.component';
import { ZoneDetailsComponent } from './zone-details/zone-details.component';

const ROUTES: Routes = [
  {
    path: '',
    component: ManageZonesComponent,
    children: [
      {
        path: '',
        component: ZoneListComponent,
      },
      {
        path: ':zoneId',
        component: ZoneDetailsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ROUTES),
    PaButtonModule,
    PaTableModule,
    PaTextFieldModule,
    PaIconModule,
    ReactiveFormsModule,
    PaScrollModule,
  ],
  declarations: [ManageZonesComponent, ZoneDetailsComponent, ZoneListComponent],
})
export class ManageZonesModule {}
