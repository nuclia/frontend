import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AccountService as CoreAccountService, SDKService } from '@flaps/core';
import { MockProvider } from 'ng-mocks';
import { firstValueFrom, of } from 'rxjs';
import { ManagerStore } from '../manager.store';
import { AccountService } from './account.service';
import { GlobalAccountService } from './global-account.service';
import { RegionalAccountService } from './regional-account.service';

describe('AccountService', () => {
  let service: AccountService;
  let patch: Mock;
  let getUsage: Mock;

  beforeEach(() => {
    patch = vi.fn().mockReturnValue(of(undefined));
    getUsage = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        MockProvider(SDKService, { nuclia: { rest: { patch }, db: { getUsage } } } as unknown as SDKService),
        MockProvider(CoreAccountService, { getAccountTypes: () => of({}) } as unknown as CoreAccountService),
        MockProvider(GlobalAccountService),
        MockProvider(RegionalAccountService),
        MockProvider(ManagerStore),
      ],
    });
    service = TestBed.inject(AccountService);
  });

  describe('setFreeTokens', () => {
    it.each([
      ['STRIPE', 'stripe'],
      ['AWS_MARKETPLACE', 'aws'],
      ['MANUAL', 'manual'],
    ] as const)('should patch the %s subscription endpoint', (provider, path) => {
      service.setFreeTokens('acc', provider, 100).subscribe();
      expect(patch).toHaveBeenCalledWith(`/billing/account/acc/${path}/subscription`, {
        free_tokens_per_billing_cycle: 100,
      });
    });

    it('should throw for a provider that cannot have free tokens', () => {
      expect(() => service.setFreeTokens('acc', 'UNKNOWN' as never, 100)).toThrow();
      expect(patch).not.toHaveBeenCalled();
    });
  });

  describe('loadTokenConsumption', () => {
    it('should return null when there is no usage', async () => {
      getUsage.mockReturnValue(of([]));
      expect(await firstValueFrom(service.loadTokenConsumption('acc', 'from'))).toBeNull();
    });

    it('should return the nuclia_tokens metric', async () => {
      const metric = { name: 'nuclia_tokens', value: 12 };
      getUsage.mockReturnValue(of([{ metrics: [{ name: 'other' }, metric] }]));
      expect(await firstValueFrom(service.loadTokenConsumption('acc', 'from'))).toBe(metric);
    });
  });
});
