import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';
import { MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockProvider(SDKService)],
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    let get: jest.Mock;

    beforeEach(() => {
      get = jest.fn().mockReturnValue(of([]));
      (service as unknown as { sdk: unknown }).sdk = { nuclia: { rest: { get } } };
    });

    it('should not add any query param without role or filters', () => {
      service.getUsers().subscribe();

      expect(get).toHaveBeenCalledWith('/manage/@users');
    });

    it('should filter by account role', () => {
      service.getUsers('AOWNER').subscribe();

      expect(get).toHaveBeenCalledWith('/manage/@users?account_role=AOWNER');
    });

    it('should filter by account types without a role', () => {
      service.getUsers(undefined, { accountTypes: ['cowork'] }).subscribe();

      expect(get).toHaveBeenCalledWith('/manage/@users?account_types=cowork');
    });

    it('should combine role, repeated account types, excluded types and include_accounts', () => {
      service
        .getUsers('AOWNER', {
          accountTypes: ['stash-trial', 'cowork'],
          excludedAccountTypes: ['v3pro'],
          includeAccounts: true,
        })
        .subscribe();

      const expectedParams = [
        'account_role=AOWNER',
        'account_types=stash-trial',
        'account_types=cowork',
        'excluded_account_types=v3pro',
        'include_accounts=true',
      ];
      expect(get).toHaveBeenCalledWith(`/manage/@users?${expectedParams.join('&')}`);
    });
  });
});
