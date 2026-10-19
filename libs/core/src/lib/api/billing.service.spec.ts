import { TestBed } from '@angular/core/testing';
import { Account } from '@nuclia/core';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { BillingService } from './billing.service';
import { SDKService } from './sdk.service';

describe('BillingService Context Box activation', () => {
  const account: Account = {
    id: 'context-box-account',
    slug: 'context-box-account',
    title: 'Context Box',
    type: 'cowork',
    workflow: 'cowork',
    can_manage_account: true,
    blocked_features: [],
    creation_date: '2026-10-19T09:00:00',
    max_agents: 1,
    max_arags: 1,
    max_kbs: 1,
    max_memories: 0,
    max_users: 5,
  };
  let currentAccount: BehaviorSubject<Account>;
  let get: jest.Mock;
  let service: BillingService;

  beforeEach(() => {
    currentAccount = new BehaviorSubject(account);
    get = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SDKService,
          useValue: { currentAccount, nuclia: { rest: { get } } },
        },
      ],
    });
    service = TestBed.inject(BillingService);
  });

  it.each<Account['type']>(['cowork', 'stash-trial'])(
    'requires activation for an unsubscribed %s Context Box without relying on trial dates',
    async (type) => {
      currentAccount.next({ ...account, type });
      get.mockReturnValue(throwError(() => ({ status: 404 })));

      await expect(firstValueFrom(service.isContextBoxActivation)).resolves.toBe(true);
      expect(get).toHaveBeenCalledWith('/billing/account/context-box-account/subscription');
    },
  );

  it('preserves the subscribed Context Box flow', async () => {
    get.mockReturnValue(of({ provider: 'STRIPE' }));

    await expect(firstValueFrom(service.isContextBoxActivation)).resolves.toBe(false);
  });

  it('does not change the classic plan-selection flow', async () => {
    currentAccount.next({ ...account, type: 'stash-trial', workflow: 'classic' });

    await expect(firstValueFrom(service.isContextBoxActivation)).resolves.toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it('surfaces subscription lookup failures instead of treating them as an unpaid account', async () => {
    const error = { status: 503 };
    get.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(service.isContextBoxActivation)).rejects.toBe(error);
  });
});
