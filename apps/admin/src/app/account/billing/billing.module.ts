import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BudgetComponent } from '@flaps/common';
import { STFPipesModule } from '@flaps/core';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaIconModule,
  PaModalModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent, CountrySelectComponent } from '@nuclia/sistema';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { CheckoutComponent } from './checkout/checkout.component';
import { FeaturesComponent } from './features/features.component';
import { HistoryComponent } from './history/history.component';
import { MySubscriptionComponent } from './my-subscription/my-subscription.component';
import { UnsubscribeComponent } from './my-subscription/unsubscribe.component';
import { RedirectComponent } from './redirect.component';
import { ReviewComponent } from './review/review.component';
import { AwsSubscriptionComponent } from './subscriptions/aws-subscription/aws-subscription.component';
import { ManualSubscriptionComponent } from './subscriptions/manual-subscription/manual-subscription.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { UsageTableComponent } from './usage/usage-table.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    ReactiveFormsModule,
    RouterModule,
    PaButtonModule,
    PaDateTimeModule,
    PaModalModule,
    PaTextFieldModule,
    PaIconModule,
    PaTableModule,
    PaTogglesModule,
    CountrySelectComponent,
    BackButtonComponent,
    STFPipesModule,
    BudgetComponent,
    SubscriptionsComponent,
    CheckoutComponent,
    ReviewComponent,
    FeaturesComponent,
    HistoryComponent,
    RedirectComponent,
    UsageTableComponent,
    MySubscriptionComponent,
    UnsubscribeComponent,
    AwsSubscriptionComponent,
    ManualSubscriptionComponent,
  ],
  exports: [SubscriptionsComponent],
})
export class BillingModule {}
