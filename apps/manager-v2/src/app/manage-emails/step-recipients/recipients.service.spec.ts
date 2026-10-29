import { TestBed } from '@angular/core/testing';
import { SisToastService } from '@nuclia/sistema';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { GlobalAccountService } from '../../manage-accounts/global-account.service';
import { UserSummary } from '../../manage-users/user.models';
import { UserService } from '../../manage-users/user.service';
import { RecipientsService } from './recipients.service';

const users: UserSummary[] = [
  { id: 'u1', name: 'Bob', email: 'bob@nuclia.com', last_login: null, '@id': '' },
  { id: 'u2', name: 'Alice', email: 'alice@nuclia.com', last_login: null, '@id': '' },
];

describe('RecipientsService', () => {
  let service: RecipientsService;
  let getUsers: jest.Mock;
  let getSubscriptions: jest.Mock;
  let error: jest.Mock;
  const selectedIds = () => Array.from(service.selected().keys());

  beforeEach(() => {
    error = jest.fn();
    getUsers = jest.fn().mockReturnValue(of(users));
    getSubscriptions = jest.fn().mockReturnValue(of([{ account_id: 'acc-stripe', type: 'stripe' }]));
    TestBed.configureTestingModule({
      providers: [
        RecipientsService,
        MockProvider(UserService, { getUsers }),
        MockProvider(GlobalAccountService, { getSubscriptions }),
        MockProvider(SisToastService, { error }),
      ],
    });
    service = TestBed.inject(RecipientsService);
  });

  it('should load account owners by default, sorted by name', () => {
    expect(getUsers).toHaveBeenCalledTimes(1);
    expect(getUsers).toHaveBeenCalledWith('AOWNER');
    expect(service.filteredUsers().map((user) => user.id)).toEqual(['u2', 'u1']);
  });

  it('should load all users without role filter', () => {
    service.selectFilter('ALL');
    expect(getUsers).toHaveBeenLastCalledWith(undefined);
  });

  it('should query each selected segment with its filters and the role', () => {
    service.search.set('ali');
    getUsers.mockClear();
    service.selectSegments(['leads', 'trials']);
    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(getUsers).toHaveBeenCalledWith('AOWNER', { accountTypes: ['stash-trial'] });
    expect(getUsers).toHaveBeenCalledWith('AOWNER', {
      excludedAccountTypes: ['stash-trial', 'cowork'],
      includeAccounts: true,
    });
    expect(service.search()).toBe('');

    getUsers.mockClear();
    service.selectFilter('AMEMBER');
    expect(getUsers).toHaveBeenCalledTimes(2);
    expect(getUsers).toHaveBeenCalledWith('AMEMBER', { accountTypes: ['stash-trial'] });

    getUsers.mockClear();
    service.selectSegments([]);
    expect(getUsers).toHaveBeenCalledTimes(1);
    expect(getUsers).toHaveBeenCalledWith('AMEMBER');
  });

  it('should list a user matching several segments once', () => {
    const bob = { ...users[0], accounts: [{ id: 'acc-none', role: 'AOWNER', type: 'v3starter' }] };
    getUsers.mockImplementation((_role, filters) => of(filters.includeAccounts ? [bob] : [bob, users[1]]));
    service.selectSegments(['trials', 'leads']);
    expect(service.users().map((user) => user.id)).toEqual(['u1', 'u2']);
  });

  it('should keep the users with an account matching the segment subscription', () => {
    const stripeUser = { ...users[0], accounts: [{ id: 'acc-stripe', role: 'AOWNER', type: 'v3starter' }] };
    const noSubscriptionUser = { ...users[1], accounts: [{ id: 'acc-free', role: 'AOWNER', type: 'v3starter' }] };
    getUsers.mockReturnValue(of([stripeUser, noSubscriptionUser]));

    service.selectSegments(['par_clients']);
    expect(getSubscriptions).toHaveBeenCalledTimes(1);
    expect(service.users().map((user) => user.id)).toEqual(['u1']);

    service.selectSegments(['leads']);
    expect(service.users().map((user) => user.id)).toEqual(['u2']);

    service.selectSegments(['progress']);
    expect(service.users()).toEqual([]);
  });

  it('should not load the subscriptions when no selected segment needs them', () => {
    service.selectSegments(['trials']);
    expect(getSubscriptions).not.toHaveBeenCalled();
  });

  it('should fail loading the users when the subscriptions are empty or unavailable', () => {
    getSubscriptions.mockReturnValue(of([]));
    service.selectSegments(['leads']);
    expect(service.loadingError()).toBe(true);
    expect(service.users()).toEqual([]);
    expect(error).toHaveBeenCalledTimes(1);

    getSubscriptions.mockReturnValue(throwError(() => new Error('boom')));
    service.reload();
    expect(service.loadingError()).toBe(true);
    expect(error).toHaveBeenCalledTimes(2);
  });

  it('should select the listed users by default and follow the filters', () => {
    expect(selectedIds()).toEqual(['u1', 'u2']);

    getUsers.mockReturnValue(of([users[0], { ...users[1], id: 'u3' }]));
    service.selectSegments(['trials']);
    expect(selectedIds()).toEqual(['u1', 'u3']);

    getUsers.mockReturnValue(of(users));
    service.selectSegments([]);
    expect(selectedIds()).toEqual(['u1', 'u2']);
  });

  it('should keep manually unchecked users unselected when the filters change', () => {
    service.toggleUser(users[0], false);
    expect(selectedIds()).toEqual(['u2']);
    service.selectFilter('ALL');
    expect(selectedIds()).toEqual(['u2']);

    service.toggleAllFiltered(false);
    expect(service.selected().size).toBe(0);
    service.toggleAllFiltered(true);
    expect(service.selected().size).toBe(2);
    expect(service.allFilteredSelected()).toBe(true);
  });

  it('should filter users by search term', () => {
    service.search.set('ali');
    expect(service.filteredUsers().map((user) => user.id)).toEqual(['u2']);
  });

  it('should go back to the default filters', () => {
    service.selectFilter('AMEMBER');
    service.search.set('zzz');
    expect(service.hasActiveFilters()).toBe(true);
    getUsers.mockClear();
    service.resetFilters();
    expect(service.recipientFilter()).toBe('AOWNER');
    expect(service.segmentFilter()).toEqual([]);
    expect(service.search()).toBe('');
    expect(service.hasActiveFilters()).toBe(false);
    expect(getUsers).toHaveBeenLastCalledWith('AOWNER');
  });

  it('should keep only the given users selected', () => {
    service.keepOnly(new Set(['u2']));
    expect(selectedIds()).toEqual(['u2']);
  });

  it('should forget the manual unchecks on reset', () => {
    service.toggleUser(users[0], false);
    service.reset();
    expect(selectedIds()).toEqual(['u1', 'u2']);
  });
});
