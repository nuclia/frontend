import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HlmAlertDialogImports } from '@nuclia/ui-spartan/alert-dialog';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { SpartanStepperImports } from '@nuclia/ui-spartan/stepper';
import { ComposeService } from '../step-compose/compose.service';
import { EmailWizardService } from '../email-wizard.service';
import { RecipientsService } from '../step-recipients/recipients.service';
import { EmailPreviewComponent } from './email-preview/email-preview.component';

@Component({
  selector: 'nma-step-review',
  templateUrl: './step-review.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmailPreviewComponent, HlmAlertDialogImports, HlmButtonImports, SpartanStepperImports],
})
export class StepReviewComponent {
  protected recipients = inject(RecipientsService);
  protected compose = inject(ComposeService);
  protected wizard = inject(EmailWizardService);
}
