import { afterNextRender, ChangeDetectionStrategy, Component, inject, Injector, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SisToastService } from '@nuclia/sistema';
import { SpartanStepper, SpartanStepperImports } from '@nuclia/ui-spartan/stepper';
import { StepComposeComponent } from './step-compose/step-compose.component';
import { ComposeService } from './step-compose/compose.service';
import { EmailWizardService } from './email-wizard.service';
import { StepRecipientsComponent } from './step-recipients/step-recipients.component';
import { RecipientsService } from './step-recipients/recipients.service';
import { StepReviewComponent } from './step-review/step-review.component';

@Component({
  selector: 'nma-manage-emails',
  templateUrl: './manage-emails.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepComposeComponent, StepRecipientsComponent, StepReviewComponent, SpartanStepperImports],
  providers: [RecipientsService, ComposeService, EmailWizardService],
})
export class ManageEmailsComponent {
  private toast = inject(SisToastService);
  private injector = inject(Injector);
  private stepper = viewChild(SpartanStepper);

  protected wizard = inject(EmailWizardService);

  constructor() {
    this.wizard.completed$.pipe(takeUntilDestroyed()).subscribe((message) => {
      // The stepper ignores going back to a step that is still bound as not editable while sending
      afterNextRender(
        () => {
          const stepper = this.stepper();
          if (stepper) {
            stepper.selectedIndex = 0;
          }
          this.toast.success(message);
        },
        { injector: this.injector },
      );
    });
  }
}
