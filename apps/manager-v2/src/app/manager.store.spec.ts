import { TestBed } from '@angular/core/testing';
import { UserType } from '@nuclia/core';
import { UserService } from '@flaps/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ManagerStore } from './manager.store';

describe('ManagerStore', () => {
  const userType = new BehaviorSubject<UserType | undefined>(undefined);

  beforeEach(() => {
    userType.next(undefined);
    TestBed.configureTestingModule({
      providers: [
        ManagerStore,
        { provide: UserService, useValue: { userType: userType.asObservable() } },
      ],
    });
  });

  it('grants ADMIN account capabilities without granting global capabilities', async () => {
    userType.next('ADMIN');
    const store = TestBed.inject(ManagerStore);

    const permissions = await Promise.all([
      firstValueFrom(store.canUseManager),
      firstValueFrom(store.canDelete),
      firstValueFrom(store.canDeleteAccount),
      firstValueFrom(store.canSeeGlobalUsers),
      firstValueFrom(store.canSeeUsers),
      firstValueFrom(store.canManageZones),
      firstValueFrom(store.canSendEmails),
      firstValueFrom(store.canEdit),
      firstValueFrom(store.canManageModels),
      firstValueFrom(store.canCreateAccount),
      firstValueFrom(store.canCreateUser),
      firstValueFrom(store.canFullyEditAccount),
      firstValueFrom(store.canAccessKBs),
      firstValueFrom(store.canAccessProjects),
    ]);

    expect(permissions).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      true,
      false,
      false,
      true,
      true,
      true,
    ]);
  });
});