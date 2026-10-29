import { TestBed } from '@angular/core/testing';
import { SisToastService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
import { UserSummary } from '../manage-users/user.models';
import { ComposeService } from './step-compose/compose.service';
import { EmailService } from './email.service';
import { BroadcastProgress } from './email.models';
import { EmailWizardService } from './email-wizard.service';
import { RecipientsLoaderService } from './step-recipients/recipients-loader.service';
import { RecipientsService } from './step-recipients/recipients.service';

const users: UserSummary[] = [
  { id: 'u1', name: 'Bob', email: 'bob@nuclia.com', last_login: null, '@id': '' },
  { id: 'u2', name: 'Alice', email: 'alice@nuclia.com', last_login: null, '@id': '' },
];

describe('EmailWizardService', () => {
  let wizard: EmailWizardService;
  let recipients: RecipientsService;
  let compose: ComposeService;
  let sendToUsers: jest.Mock;
  let error: jest.Mock;
  let completed: jest.Mock;
  const selectedIds = () => Array.from(recipients.selected().keys());

  beforeEach(() => {
    error = jest.fn();
    completed = jest.fn();
    sendToUsers = jest.fn().mockReturnValue(of({ requested: 2, queued: 2, failed: [] }));
    TestBed.configureTestingModule({
      providers: [
        RecipientsService,
        ComposeService,
        EmailWizardService,
        MockProvider(RecipientsLoaderService, { load: jest.fn().mockReturnValue(of(users)) }),
        MockProvider(EmailService, { sendToUsers }),
        MockProvider(SisToastService, { error }),
      ],
    });
    wizard = TestBed.inject(EmailWizardService);
    recipients = TestBed.inject(RecipientsService);
    compose = TestBed.inject(ComposeService);
    wizard.completed$.subscribe(completed);
    compose.subject.set('Hello');
    compose.title.set('News');
    compose.body.set('Body');
    compose.senderName.set(' Nuclia Team ');
  });

  it('should require recipients, subject and body to move forward', () => {
    expect(wizard.canCompose()).toBe(true);
    expect(wizard.canReview()).toBe(true);
    compose.body.set(' ');
    expect(wizard.canReview()).toBe(false);
    recipients.toggleAllFiltered(false);
    expect(wizard.canCompose()).toBe(false);
  });

  it('should send the html body to the selected users with the trimmed sender name', () => {
    const body = compose.buildBody();
    recipients.toggleUser(users[1], false);
    wizard.send();
    expect(sendToUsers).toHaveBeenCalledWith(['u1'], 'Hello', body, 'Nuclia Team');
  });

  it('should clear everything and emit the success message once sent', () => {
    const result$ = new Subject<BroadcastProgress>();
    sendToUsers.mockReturnValue(result$);
    recipients.toggleUser(users[0], false);
    wizard.send();
    wizard.send();
    expect(sendToUsers).toHaveBeenCalledTimes(1);
    expect(wizard.sending()).toBe(true);

    result$.next({ requested: 1, queued: 1, failed: [] });
    expect(completed).not.toHaveBeenCalled();
    result$.complete();
    expect(completed).toHaveBeenCalledWith('1 emails queued for delivery');
    expect(error).not.toHaveBeenCalled();
    expect(wizard.sending()).toBe(false);
    expect(wizard.progress()).toBeNull();
    expect(selectedIds()).toEqual(['u1', 'u2']);
    expect([compose.subject(), compose.title(), compose.body(), compose.senderName()]).toEqual(['', '', '', '']);
  });

  it('should show an error toast and keep the data when nothing could be sent', () => {
    sendToUsers.mockReturnValue(of({ requested: 2, queued: 0, failed: [{ user_id: 'u1', error: 'Mail down' }] }));
    wizard.send();
    expect(error).toHaveBeenCalledWith('Mail down');
    expect(completed).not.toHaveBeenCalled();
    expect(selectedIds()).toEqual(['u1', 'u2']);
    expect(compose.subject()).toBe('Hello');
    expect(wizard.sending()).toBe(false);
    expect(wizard.failedRecipients()).toEqual([{ label: 'bob@nuclia.com', error: 'Mail down' }]);
  });

  it('should keep only the failed recipients selected after a partial failure', () => {
    sendToUsers.mockReturnValue(of({ requested: 2, queued: 1, failed: [{ user_id: 'u2', error: 'Bounce' }] }));
    wizard.send();
    expect(error).toHaveBeenCalled();
    expect(completed).not.toHaveBeenCalled();
    expect(selectedIds()).toEqual(['u2']);
    expect(compose.subject()).toBe('Hello');
  });

  it('should allow sending again after an error', () => {
    sendToUsers.mockReturnValueOnce(throwError(() => ({ body: { detail: 'Boom' } })));
    wizard.send();
    expect(error).toHaveBeenCalledWith('Boom');
    expect(wizard.sending()).toBe(false);
    wizard.send();
    expect(completed).toHaveBeenCalledWith('2 emails queued for delivery');
  });
});
