import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmLabelImports } from '@nuclia/ui-spartan/label';
import { SpartanStepperImports } from '@nuclia/ui-spartan/stepper';
import { HlmTextareaImports } from '@nuclia/ui-spartan/textarea';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';
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
  providers: [provideIcons({ lucideInfo })],
})
export class StepComposeComponent {
  protected compose = inject(ComposeService);
  protected wizard = inject(EmailWizardService);

  readonly senderNameHelp = `Shown as the sender in the recipient’s inbox, up to ${SENDER_NAME_MAX_LENGTH} characters. The sender email address does not change. Leave empty to use the default name.`;
}
