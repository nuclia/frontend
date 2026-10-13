import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {
  PaButtonModule,
  PaIconModule,
  PaScrollModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ManageZonesComponent } from './manage-zones.component';
import { ZoneDetailsComponent } from './zone-details/zone-details.component';
import { ZoneListComponent } from './zone-list/zone-list.component';

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
        path: ':zoneId', // same path used when adding a zone, where the "id" is "add"
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
    PaTogglesModule,
    ReactiveFormsModule,
    PaScrollModule,
    TranslatePipe,
    ManageZonesComponent,
    ZoneDetailsComponent,
    ZoneListComponent,
  ],
})
export class ManageZonesModule {}
