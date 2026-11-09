import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmAlertImports } from '@nuclia/ui-spartan/alert';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { SubscriptionDeleteComponent } from './subscription-delete/subscription-delete.component';
import { SubscriptionFieldsComponent } from './subscription-fields/subscription-fields.component';
import { SubscriptionsService } from './subscriptions.service';

@Component({
  selector: 'nma-subscriptions',
  templateUrl: './subscriptions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SubscriptionsService],
  imports: [
    ReactiveFormsModule,
    HlmAlertImports,
    HlmButtonImports,
    SubscriptionDeleteComponent,
    SubscriptionFieldsComponent,
  ],
})
export class SubscriptionsComponent {
  protected vm = inject(SubscriptionsService);
}
