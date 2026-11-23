import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { matInfoRound } from '@ng-icons/material-symbols/round';
import { HlmButtonImports } from '@progress/pdp-ui-spartan/button';
import { HlmInputImports } from '@progress/pdp-ui-spartan/input';
import { HlmLabelImports } from '@progress/pdp-ui-spartan/label';
import { SpartanStepperImports } from '@progress/pdp-ui-spartan/stepper';
import { HlmTextareaImports } from '@progress/pdp-ui-spartan/textarea';
import { HlmTooltipImports } from '@progress/pdp-ui-spartan/tooltip';
import { EmailWizardService } from '../email-wizard.service';
import { ComposeService } from './compose.service';
import { PersonalizationHelpComponent } from './personalization-help/personalization-help.component';
import { SENDER_NAME_MAX_LENGTH } from './sender-name.utils';

@Component({
  selector: 'nma-step-compose',
  templateUrl: './step-compose.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmTextareaImports,
    HlmTooltipImports,
    NgIcon,
    PersonalizationHelpComponent,
    SpartanStepperImports,
  ],
  providers: [provideIcons({ matInfoRound })],
})
export class StepComposeComponent {
  protected compose = inject(ComposeService);
  protected wizard = inject(EmailWizardService);

  readonly senderNameHelp = `Shown as the sender in the recipient’s inbox, up to ${SENDER_NAME_MAX_LENGTH} characters. The sender email address does not change. Leave empty to use the default name.`;
}
