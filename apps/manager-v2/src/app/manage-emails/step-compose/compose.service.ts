import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SisToastService } from '@nuclia/sistema';
import { EmailService, getEmailErrorMessage } from '../email.service';
import { buildEmailBody } from './email-body.utils';
import { normalizeSenderName, validateSenderName } from './sender-name.utils';

/** Content of the email written in the compose step. Provided by the wizard component. */
@Injectable()
export class ComposeService {
  private emailService = inject(EmailService);
  private toast = inject(SisToastService);
  private destroyRef = inject(DestroyRef);

  subject = signal('');
  title = signal('');
  body = signal('');
  senderName = signal('');
  sendingTest = signal(false);

  senderNameError = computed(() => validateSenderName(this.senderName()));
  isComplete = computed(() => !!this.subject().trim() && !!this.body().trim() && !this.senderNameError());

  /** The message as sent to the backend: HTML with the optional title as heading. */
  buildBody(): string {
    return buildEmailBody(this.title(), this.body());
  }

  /** The trimmed sender name; empty means the default one. */
  getSenderName(): string {
    return normalizeSenderName(this.senderName());
  }

  insert(snippet: string) {
    this.body.update((body) => `${body}${snippet}`);
  }

  sendTest() {
    if (!this.isComplete()) {
      return;
    }
    this.sendingTest.set(true);
    this.emailService
      .sendTestEmail(this.subject(), this.buildBody(), this.getSenderName())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.sendingTest.set(false);
          this.toast.success(`Test email sent to ${response.preview_recipient || 'you'}`);
        },
        error: (error) => {
          this.sendingTest.set(false);
          this.toast.error(getEmailErrorMessage(error));
        },
      });
  }

  reset() {
    this.subject.set('');
    this.title.set('');
    this.body.set('');
    this.senderName.set('');
  }
}
