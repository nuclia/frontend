import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SisToastService } from '@nuclia/sistema';
import { Subject } from 'rxjs';
import { ComposeService } from './step-compose/compose.service';
import { BroadcastProgress } from './email.models';
import { EmailService, getEmailErrorMessage } from './email.service';
import { RecipientsService } from './step-recipients/recipients.service';

/** Orchestrates the recipients and the composed email: step completion, sending and the reset afterwards. */
@Injectable()
export class EmailWizardService {
  private emailService = inject(EmailService);
  private recipients = inject(RecipientsService);
  private compose = inject(ComposeService);
  private toast = inject(SisToastService);
  private destroyRef = inject(DestroyRef);
  private completedSubject = new Subject<string>();

  sending = signal(false);
  progress = signal<BroadcastProgress | null>(null);

  canCompose = computed(() => this.recipients.selected().size > 0);
  canReview = computed(() => this.canCompose() && this.compose.isComplete());
  failedRecipients = computed(() => {
    const selected = this.recipients.selected();
    return (this.progress()?.failed || []).map((failure) => ({
      label: selected.get(failure.user_id)?.email || failure.user_id,
      error: failure.error,
    }));
  });

  /** Emits the success message once everything has been sent and the wizard data is cleared. */
  completed$ = this.completedSubject.asObservable();

  send() {
    if (this.sending()) {
      return;
    }
    this.sending.set(true);
    this.progress.set({ requested: this.recipients.selected().size, queued: 0, failed: [] });
    this.emailService
      .sendToUsers(
        Array.from(this.recipients.selected().keys()),
        this.compose.subject(),
        this.compose.buildBody(),
        this.compose.getSenderName(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (progress) => this.progress.set(progress),
        error: (error) => {
          this.sending.set(false);
          this.toast.error(getEmailErrorMessage(error));
        },
        complete: () => {
          this.sending.set(false);
          this.onSendCompleted();
        },
      });
  }

  private onSendCompleted() {
    const result = this.progress();
    if (!result || result.failed.length === 0) {
      this.reset();
      this.completedSubject.next(`${result?.queued ?? 0} emails queued for delivery`);
      return;
    }
    if (result.queued > 0) {
      // Keep only the failed recipients selected, so retrying doesn't send duplicates to the others
      this.recipients.keepOnly(new Set(result.failed.map((failure) => failure.user_id)));
      this.toast.error(
        `${result.failed.length} of ${result.requested} emails failed. Only the failed recipients remain selected, you can try again.`,
      );
    } else {
      this.toast.error(result.failed[0].error || 'Emails could not be sent, please try again.');
    }
  }

  private reset() {
    this.progress.set(null);
    this.recipients.reset();
    this.compose.reset();
  }
}
