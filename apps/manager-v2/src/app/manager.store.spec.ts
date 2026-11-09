import { UserService } from '@flaps/core';
import { AccountBlockingState } from '@nuclia/core';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
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
    const read = (permission: Observable<boolean>) => firstValueFrom(permission);
    return Promise.all([
      read(store.canUseManager),
      read(store.canEdit),
      read(store.canDelete),
      read(store.canSeeUsers),
      read(store.canManageModels),
    ]);
  };

  it('should give ROOT every permission', async () => {
    expect(await permissions('ROOT')).toEqual([true, true, true, true, true]);
  });

  it('should keep READONLY away from edition but allow reading users', async () => {
    expect(await permissions('READONLY')).toEqual([true, false, false, true, false]);
  });

  it('should refuse everything to USER', async () => {
    expect(await permissions('USER')).toEqual([false, false, false, false, false]);
  });

  it('should grant ADMIN account capabilities without granting global capabilities', async () => {
    userType.next('ADMIN');
    const read = (permission: Observable<boolean>) => firstValueFrom(permission);

    expect(
      await Promise.all([
        read(store.canUseManager),
        read(store.canDelete),
        read(store.canDeleteAccount),
        read(store.canSeeGlobalUsers),
        read(store.canSeeUsers),
        read(store.canManageZones),
        read(store.canSendEmails),
        read(store.canEdit),
        read(store.canManageModels),
        read(store.canCreateAccount),
        read(store.canCreateUser),
        read(store.canFullyEditAccount),
        read(store.canAccessKBs),
        read(store.canAccessProjects),
      ]),
    ).toEqual([true, false, true, false, true, false, false, true, true, false, false, true, true, true]);
  });

  it('should expose the blocking state label of the account', async () => {
    store.setAccountDetails({ blockingState: AccountBlockingState.QUOTA } as AccountDetails);
    expect(await firstValueFrom(store.currentState)).toBe('Blocked due to quota');
  });

  it('should sort account users with managers first, then by name', async () => {
    store.setAccountUsers([
      { id: '1', name: 'Zoe', email: '' },
      { id: '2', name: 'Bob', email: '' },
      { id: '3', name: 'Yann', email: '', isManager: true },
    ] as AccountUser[]);
    const users = await firstValueFrom(store.accountUsers);
    expect(users.map((user) => user.name)).toEqual(['Yann', 'Bob', 'Zoe']);
  });
});
