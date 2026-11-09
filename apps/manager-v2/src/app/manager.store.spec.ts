import { UserService } from '@flaps/core';
import { AccountBlockingState } from '@nuclia/core';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { AccountDetails, AccountUser } from './manage-accounts/account-ui.models';
import { ManagerStore } from './manager.store';

describe('ManagerStore', () => {
  const userType = new BehaviorSubject<string | undefined>(undefined);
  let store: ManagerStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockProvider(UserService, { userType } as unknown as UserService)],
    });
    store = TestBed.inject(ManagerStore);
  });

  const permissions = (type: string) => {
    userType.next(type);
    return [store.canUseManager, store.canEdit, store.canDelete, store.canSeeUsers, store.canManageModels].map(
      (permission) => permission(),
    );
  };

  it('should give ROOT every permission', () => {
    expect(permissions('ROOT')).toEqual([true, true, true, true, true]);
  });

  it('should keep READONLY away from edition but allow reading users', () => {
    expect(permissions('READONLY')).toEqual([true, false, false, true, false]);
  });

  it('should refuse everything to USER', () => {
    expect(permissions('USER')).toEqual([false, false, false, false, false]);
  });

  it('should grant ADMIN account capabilities without granting global capabilities', () => {
    userType.next('ADMIN');

    expect(
      [
        store.canUseManager,
        store.canDelete,
        store.canDeleteAccount,
        store.canSeeGlobalUsers,
        store.canSeeUsers,
        store.canManageZones,
        store.canSendEmails,
        store.canEdit,
        store.canManageModels,
        store.canCreateAccount,
        store.canCreateUser,
        store.canFullyEditAccount,
        store.canAccessKBs,
        store.canAccessProjects,
      ].map((permission) => permission()),
    ).toEqual([true, false, true, false, true, false, false, true, true, false, false, true, true, true]);
  });

  it('should expose the blocking state label of the account', () => {
    store.setAccountDetails({ blockingState: AccountBlockingState.QUOTA } as AccountDetails);
    expect(store.currentState()).toBe('Blocked due to quota');
  });

  it('should sort account users with managers first, then by name', () => {
    store.setAccountUsers([
      { id: '1', name: 'Zoe', email: '' },
      { id: '2', name: 'Bob', email: '' },
      { id: '3', name: 'Yann', email: '', isManager: true },
    ] as AccountUser[]);
    expect(store.accountUsers().map((user) => user.name)).toEqual(['Yann', 'Bob', 'Zoe']);
  });
});
