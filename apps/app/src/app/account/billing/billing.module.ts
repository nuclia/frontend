import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { STFSectionNavbarModule } from '@flaps/common';
import { PaButtonModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { BillingComponent } from './billing.component';
import { PlansComponent } from './plans/plans.component';

const routes = [
  {
    path: '',
    component: BillingComponent,
    children: [
      {
        path: 'plans',
        component: PlansComponent,
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    AngularSvgIconModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatDialogModule,
    STFSectionNavbarModule,
    PaButtonModule,
    PaTooltipModule,
  ],
  declarations: [BillingComponent, PlansComponent],
  exports: [],
})
export class BillingModule {}
