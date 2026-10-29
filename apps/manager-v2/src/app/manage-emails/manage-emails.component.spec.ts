import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SisToastService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { GlobalAccountService } from '../manage-accounts/global-account.service';
import { UserSummary } from '../manage-users/user.models';
import { UserService } from '../manage-users/user.service';
import { EmailWizardService } from './email-wizard.service';
import { BroadcastProgress } from './email.models';
import { EmailService } from './email.service';
import { ManageEmailsComponent } from './manage-emails.component';

const users: UserSummary[] = [
  { id: 'u1', name: 'Bob', email: 'bob@nuclia.com', last_login: null, '@id': '' },
  { id: 'u2', name: 'Alice', email: 'alice@nuclia.com', last_login: null, '@id': '' },
];

describe('ManageEmailsComponent', () => {
  let fixture: ComponentFixture<ManageEmailsComponent>;
  let getUsers: jest.Mock;
  let sendToUsers: jest.Mock;
  let success: jest.Mock;
  const el = (): HTMLElement => fixture.nativeElement;
  const find = <T extends HTMLElement>(selector: string): T => {
    const element = el().querySelector<T>(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    return element;
  };
  const buttonWithText = (text: string) => {
    const button = Array.from(el().querySelectorAll('button')).find((button) => button.textContent?.includes(text));
    if (!button) {
      throw new Error(`Button not found: ${text}`);
    }
    return button;
  };
  const click = (selector: string) => {
    find(selector).click();
    fixture.detectChanges();
  };
  const type = (selector: string, value: string) => {
    const input = find<HTMLInputElement>(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const tab = () => find('[role="tab"][aria-selected="true"]').textContent;

  beforeEach(async () => {
    success = jest.fn();
    getUsers = jest.fn().mockReturnValue(of(users));
    sendToUsers = jest.fn().mockReturnValue(of({ requested: 2, queued: 2, failed: [] }));
    await TestBed.configureTestingModule({
      imports: [ManageEmailsComponent],
      providers: [
        MockProvider(UserService, { getUsers }),
        MockProvider(GlobalAccountService, { getSubscriptions: jest.fn().mockReturnValue(of([])) }),
        MockProvider(EmailService, { sendToUsers }),
        MockProvider(SisToastService, { error: jest.fn(), success }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageEmailsComponent);
    fixture.detectChanges();
  });

  it('should only mark a step as done once it is completed and left', () => {
    const done = () =>
      Array.from(el().querySelectorAll('spartan-step-header')).map((header) => !!header.querySelector('ng-icon'));
    expect(done()).toEqual([false, false, false]);

    click('[spartanStepperNext]');
    expect(done()).toEqual([true, false, false]);
  });

  it('should show an empty state with a reset button when the filters return no users', () => {
    getUsers.mockReturnValue(of([]));
    buttonWithText('Trials').click();
    fixture.detectChanges();
    expect(el().textContent).toContain('No users match the selected filters.');

    getUsers.mockReturnValue(of(users));
    buttonWithText('Reset filters').click();
    fixture.detectChanges();
    expect(el().textContent).not.toContain('No users match the selected filters.');
    expect(el().textContent).toContain('2 selected');
  });

  it('should show a success toast and go back to the first step after sending', () => {
    const result$ = new Subject<BroadcastProgress>();
    sendToUsers.mockReturnValue(result$);
    click('[spartanStepperNext]');
    type('#email-subject', 'Hello');
    type('#email-body', 'Body');
    click('[spartanStepperNext]');
    expect(tab()).toContain('Review & send');

    // The confirm dialog renders in a portal, so the wizard is driven directly like its "Send" button does
    expect(buttonWithText('Send to 2 users')).toBeTruthy();
    fixture.debugElement.injector.get(EmailWizardService).send();
    fixture.detectChanges();
    expect(tab()).toContain('Review & send');

    result$.next({ requested: 2, queued: 2, failed: [] });
    result$.complete();
    fixture.detectChanges();
    expect(success).toHaveBeenCalledWith('2 emails queued for delivery');
    expect(tab()).toContain('Recipients');
  });
});
