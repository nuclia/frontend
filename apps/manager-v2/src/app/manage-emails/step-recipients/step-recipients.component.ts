import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStepperImports } from '@progress/pdp-ui';
import { HlmButtonImports } from '@progress/pdp-ui-spartan/button';
import { RecipientFiltersComponent } from './recipient-filters/recipient-filters.component';
import { RecipientListComponent } from './recipient-list/recipient-list.component';
import { RecipientsService } from './recipients.service';

@Component({
  selector: 'nma-step-recipients',
  templateUrl: './step-recipients.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports, RecipientFiltersComponent, RecipientListComponent, UiStepperImports],
})
export class StepRecipientsComponent {
  protected recipients = inject(RecipientsService);
}
