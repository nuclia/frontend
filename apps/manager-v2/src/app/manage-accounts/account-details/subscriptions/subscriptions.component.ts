import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UiOptionWithDescriptionImports } from '@nuclia/ui/option-with-description';
import { HlmAlertImports } from '@nuclia/ui-spartan/alert';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { SubscriptionsService } from './subscriptions.service';

@Component({
  selector: 'nma-subscriptions',
  templateUrl: './subscriptions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SubscriptionsService],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HlmAlertImports,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    UiOptionWithDescriptionImports,
    NgTemplateOutlet,
  ],
})
export class SubscriptionsComponent {
  protected service = inject(SubscriptionsService);

  showCloudZeroDeleteConfirm = signal(false);
  showManualDeleteConfirm = signal(false);
}
