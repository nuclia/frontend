import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UiOptionWithDescription } from '@nuclia/ui/option-with-description';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { SubscriptionsService } from '../subscriptions.service';

@Component({
  selector: 'app-subscription-fields',
  templateUrl: './subscription-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [ReactiveFormsModule, HlmFieldImports, HlmInputImports, HlmSelectImports, UiOptionWithDescription],
})
export class SubscriptionFieldsComponent {
  form = input.required<FormGroup>();
  idPrefix = input.required<string>();
  isCloudZero = input(false);
  showAction = input(false);

  protected vm = inject(SubscriptionsService);
}
