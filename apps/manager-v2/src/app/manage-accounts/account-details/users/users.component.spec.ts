import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { AccountUser } from '../../account-ui.models';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  const accountUsers = signal<AccountUser[]>([]);
  const user = { id: '34f005d3-3cc1-41e4-8392-0dfd70e122df', email: 'catwoman+new@nuclia.com', name: 'catwoman' };
  const otherManager = { id: 'other', email: 'batman@nuclia.com', name: 'batman', isManager: true };

  const candidate = { id: 'candidate-id', name: 'Robin', email: 'robin@nuclia.com' };
  const addAccountUser = vi.fn(() => of([]));

  beforeEach(async () => {
    accountUsers.set([user]);
    addAccountUser.mockClear();
    Element.prototype.scrollIntoView = vi.fn();
    await TestBed.configureTestingModule({
      imports: [UsersComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(AccountService, {
          loadAccountUsers: vi.fn(() => of([])),
          addAccountUser,
        }),
        MockProvider(UserService, { searchUser: vi.fn(() => of([candidate])) }),
        MockProvider(ManagerStore, {
          canEdit: signal(true),
          accountDetails: signal(ACCOUNT_DETAILS),
          accountUsers,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((overlay) => (overlay.innerHTML = ''));
  });

  const openMenu = async () => {
    fixture.nativeElement.querySelector('button[aria-label="Menu"]').click();
    await fixture.whenStable();
    fixture.detectChanges();
    return Array.from(document.querySelectorAll('[hlmDropdownMenuItem]')).map((item) => item.textContent?.trim());
  };

  const closeMenu = async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.nativeElement.querySelector('button[aria-label="Menu"]').click();
    await fixture.whenStable();
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should offer the actions matching the current role when the menu is reopened', async () => {
    expect(await openMenu()).toContain('Add to managers');

    await closeMenu();
    accountUsers.set([{ ...user, isManager: true }, otherManager]);
    fixture.detectChanges();

    const items = await openMenu();
    expect(items).toContain('Remove from managers');
    expect(items).not.toContain('Add to managers');
  });

  it('should add the selected member and clear the search input', async () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#account-add-member');
    input.value = 'rob';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(document.querySelector('hlm-autocomplete-item')).toBeTruthy();
    });

    (document.querySelector('hlm-autocomplete-item') as HTMLElement).click();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    expect(addAccountUser).toHaveBeenCalledWith(expect.anything(), candidate.id);
    expect(input.value).toBe('');
  });
});
