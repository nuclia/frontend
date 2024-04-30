import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaIconModule,
  PaModalModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisProgressModule } from '@nuclia/sistema';
import { STFPipesModule } from '@flaps/core';
import { BillingComponent } from './billing.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ReviewComponent } from './review/review.component';
import { FeaturesComponent } from './features/features.component';
import { HistoryComponent } from './history/history.component';
import { UsageComponent } from './usage/usage.component';
import { UsageTableComponent } from './usage/usage-table.component';
import { RedirectComponent } from './redirect.component';
import { MySubscriptionComponent } from './my-subscription/my-subscription.component';
import { UnsubscribeComponent } from './my-subscription/unsubscribe.component';
import { AwsSubscriptionComponent } from './subscriptions/aws-subscription/aws-subscription.component';
import { BudgetComponent } from './usage/budget.component';

const routes: Routes = [
  {
    path: '',
    component: BillingComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: RedirectComponent,
      },
      {
        path: 'subscriptions',
        component: SubscriptionsComponent,
      },
      {
        path: 'checkout',
        component: CheckoutComponent,
      },
      {
        path: 'my-subscription',
        component: MySubscriptionComponent,
      },
      {
        path: 'usage',
        component: UsageComponent,
      },
      {
        path: 'history',
        component: HistoryComponent,
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
    PaDateTimeModule,
    PaModalModule,
    PaTextFieldModule,
    PaIconModule,
    PaTableModule,
    PaTogglesModule,
    SisProgressModule,
    STFPipesModule,
  ],
  declarations: [
    BillingComponent,
    SubscriptionsComponent,
    CheckoutComponent,
    ReviewComponent,
    FeaturesComponent,
    HistoryComponent,
    RedirectComponent,
    UsageComponent,
    UsageTableComponent,
    MySubscriptionComponent,
    UnsubscribeComponent,
    AwsSubscriptionComponent,
    BudgetComponent,
  ],
  exports: [UsageTableComponent],
})
export class BillingModule {}
