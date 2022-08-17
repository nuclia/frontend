import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { STFSectionNavbarModule } from '@flaps/common';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { BillingComponent } from './billing.component';
import { PlansComponent } from './plans/plans.component';
import { PlansSettingsComponent } from './settings/plan-settings.component';
import { PaymentComponent } from './payment/payment.component';
import { CardComponent } from './card/card.component';

const routes = [
  {
    path: '',
    component: BillingComponent,
    children: [
      {
        path: 'plans',
        component: PlansComponent,
      },
      {
        path: 'settings',
        component: PlansSettingsComponent,
      },
      {
        path: 'payment',
        component: PaymentComponent,
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
    PaTextFieldModule,
    PaTooltipModule,
    PaIconModule,
  ],
  declarations: [BillingComponent, PlansComponent, PlansSettingsComponent, PaymentComponent, CardComponent],
  exports: [],
})
export class BillingModule {}
