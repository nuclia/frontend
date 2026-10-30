import { TestBed } from '@angular/core/testing';
import { SDKService } from '@flaps/core';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { EMAIL_BATCH_SIZE, EmailService, getEmailErrorMessage } from './email.service';
import { BroadcastEmailResponse, BroadcastProgress } from './email.models';

describe('EmailService', () => {
  let service: EmailService;
  let post: jest.Mock;

  beforeEach(() => {
    post = jest.fn();
    TestBed.configureTestingModule({
      providers: [MockProvider(SDKService, { nuclia: { rest: { post } } } as unknown as SDKService)],
    });
    service = TestBed.inject(EmailService);
  });

  const response = (ids: string[]): BroadcastEmailResponse => ({
    dry_run: false,
    requested_count: ids.length,
    queued_count: ids.length,
    failed_count: 0,
    queued_user_ids: ids,
    failed: [],
  });

  it('should send a dry run without user ids', () => {
    post.mockReturnValue(of({ dry_run: true, preview_recipient: 'root@nuclia.com' }));
    service.sendTestEmail('subject', '<p>body</p>').subscribe();
    expect(post).toHaveBeenCalledWith('/manage/email', {
      user_ids: [],
      subject: 'subject',
      body_content: '<p>body</p>',
      is_dry_run: true,
    });
  });

  it('should include the sender name only when provided', () => {
    post.mockReturnValue(of(response([])));
    service.sendTestEmail('s', 'b', 'Nuclia Team').subscribe();
    expect(post).toHaveBeenLastCalledWith('/manage/email', {
      user_ids: [],
      subject: 's',
      body_content: 'b',
      sender_name: 'Nuclia Team',
      is_dry_run: true,
    });

    service.sendToUsers(['u1'], 's', 'b', 'Nuclia Team').subscribe();
    expect(post).toHaveBeenLastCalledWith('/manage/email', {
      user_ids: ['u1'],
      subject: 's',
      body_content: 'b',
      sender_name: 'Nuclia Team',
      is_dry_run: false,
    });

    service.sendToUsers(['u1'], 's', 'b', '').subscribe();
    expect(post.mock.lastCall?.[1]).not.toHaveProperty('sender_name');
  });

  it('should split recipients in batches and accumulate progress', () => {
    post.mockImplementation((_: string, payload: { user_ids: string[] }) => of(response(payload.user_ids)));
    const ids = Array.from({ length: EMAIL_BATCH_SIZE + 1 }, (_, i) => `u${i}`);
    const emitted: BroadcastProgress[] = [];

    service.sendToUsers(ids, 's', 'b').subscribe((progress) => emitted.push(progress));

    expect(post).toHaveBeenCalledTimes(2);
    expect(emitted.length).toBe(2);
    expect(emitted[1]).toEqual({ requested: ids.length, queued: ids.length, failed: [] });
  });

  it('should report a failing batch as failed recipients and continue', () => {
    post
      .mockReturnValueOnce(throwError(() => ({ status: 400, body: { detail: 'Invalid template syntax' } })))
      .mockReturnValueOnce(of(response(['u100'])));
    const ids = Array.from({ length: EMAIL_BATCH_SIZE + 1 }, (_, i) => `u${i}`);
    let last: BroadcastProgress | undefined;

    service.sendToUsers(ids, 's', 'b').subscribe((progress) => (last = progress));

    expect(last?.queued).toBe(1);
    expect(last?.failed.length).toBe(EMAIL_BATCH_SIZE);
    expect(last?.failed[0]).toEqual({ user_id: 'u0', error: 'Invalid template syntax' });
  });

  it('should extract backend error details', () => {
    expect(getEmailErrorMessage({ body: { detail: 'Mailer is not configured' } })).toBe('Mailer is not configured');
    expect(getEmailErrorMessage(new Error('boom'))).toBe('Unexpected error, please try again.');
  });
});
