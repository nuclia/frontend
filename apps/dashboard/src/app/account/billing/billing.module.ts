import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PaButtonModule, PaIconModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { BillingComponent } from './billing.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { CheckoutComponent } from './checkout/checkout.component';

const routes: Routes = [
  {
    path: '',
    component: BillingComponent,
    children: [
      {
        path: '',
        redirectTo: 'subscriptions',
        pathMatch: 'full',
      },
      {
        path: 'subscriptions',
        component: SubscriptionsComponent,
      },
      {
        path: 'checkout',
        component: CheckoutComponent,
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
    PaButtonModule,
    PaModalModule,
    PaTextFieldModule,
    PaIconModule,
  ],
  declarations: [BillingComponent, SubscriptionsComponent, CheckoutComponent],
  exports: [],
})
export class BillingModule {}
