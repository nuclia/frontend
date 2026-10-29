import { TestBed } from '@angular/core/testing';
import { SisToastService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { ComposeService } from './compose.service';
import { EmailService } from '../email.service';

describe('ComposeService', () => {
  let service: ComposeService;
  let sendTestEmail: jest.Mock;
  let error: jest.Mock;
  let success: jest.Mock;

  beforeEach(() => {
    error = jest.fn();
    success = jest.fn();
    sendTestEmail = jest.fn().mockReturnValue(of({ preview_recipient: 'root@nuclia.com' }));
    TestBed.configureTestingModule({
      providers: [
        ComposeService,
        MockProvider(EmailService, { sendTestEmail }),
        MockProvider(SisToastService, { error, success }),
      ],
    });
    service = TestBed.inject(ComposeService);
  });

  it('should require a subject and a body', () => {
    expect(service.isComplete()).toBe(false);
    service.subject.set('Hello');
    service.body.set('  ');
    expect(service.isComplete()).toBe(false);
    service.body.set('Body');
    expect(service.isComplete()).toBe(true);
  });

  it('should build the html body with the optional title', () => {
    service.title.set('News');
    service.body.set('Line 1\n\nLine 2');
    expect(service.buildBody()).toBe(
      '<h1 style="margin: 0 0 32px; font-size: 28px; line-height: 32px; color: #000000; font-weight: 600;">News</h1>' +
        '<p style="margin: 0 0 16px;text-align: justify">Line 1</p>' +
        '<p style="margin: 0 0 16px;text-align: justify">Line 2</p>',
    );
  });

  it('should append the placeholders to the body', () => {
    service.body.set('Hello ');
    service.insert('{{ user_name }}');
    expect(service.body()).toBe('Hello {{ user_name }}');
  });

  it('should not allow an invalid sender name', () => {
    service.subject.set('Hello');
    service.body.set('Body');
    service.senderName.set('ceo@nuclia.com');
    expect(service.senderNameError()).toBeTruthy();
    expect(service.isComplete()).toBe(false);
    service.sendTest();
    expect(sendTestEmail).not.toHaveBeenCalled();

    service.senderName.set('  Nuclia Team ');
    expect(service.isComplete()).toBe(true);
    service.sendTest();
    expect(sendTestEmail).toHaveBeenCalledWith('Hello', expect.any(String), 'Nuclia Team');
    expect(success).toHaveBeenCalledWith('Test email sent to root@nuclia.com');
    expect(service.sendingTest()).toBe(false);
  });

  it('should show an error when the test email fails', () => {
    service.subject.set('Hello');
    service.body.set('Body');
    sendTestEmail.mockReturnValue(throwError(() => ({ body: { detail: 'Boom' } })));
    service.sendTest();
    expect(error).toHaveBeenCalledWith('Boom');
    expect(service.sendingTest()).toBe(false);
  });

  it('should clear the content on reset', () => {
    service.subject.set('Hello');
    service.title.set('News');
    service.body.set('Body');
    service.senderName.set('Nuclia Team');
    service.reset();
    expect([service.subject(), service.title(), service.body(), service.senderName()]).toEqual(['', '', '', '']);
  });
});
