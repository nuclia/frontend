import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStepperImports } from '@progress/pdp-ui';
import { HlmAlertDialogImports } from '@progress/pdp-ui-spartan/alert-dialog';
import { HlmButtonImports } from '@progress/pdp-ui-spartan/button';
import { EmailWizardService } from '../email-wizard.service';
import { ComposeService } from '../step-compose/compose.service';
import { RecipientsService } from '../step-recipients/recipients.service';
import { EmailPreviewComponent } from './email-preview/email-preview.component';

@Component({
  selector: 'nma-step-review',
  templateUrl: './step-review.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmailPreviewComponent, HlmAlertDialogImports, HlmButtonImports, UiStepperImports],
})
export class StepReviewComponent {
  protected recipients = inject(RecipientsService);
  protected compose = inject(ComposeService);
  protected wizard = inject(EmailWizardService);
}
