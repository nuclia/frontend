import type { Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SDKService } from '@flaps/core';
import { AccountBlockingState } from '@nuclia/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { BlockedFeatureFormValues } from './account-ui.models';
import { GlobalAccountService } from './global-account.service';

describe('GlobalAccountService', () => {
  let service: GlobalAccountService;
  let patch: Mock;

  beforeEach(() => {
    patch = vi.fn().mockReturnValue(of(undefined));
    TestBed.configureTestingModule({
      providers: [MockProvider(SDKService, { nuclia: { rest: { patch } } } as unknown as SDKService)],
    });
    service = TestBed.inject(GlobalAccountService);
  });

  describe('updateBlockedFeatures', () => {
    it('should block the account on the manager side when at least one feature is blocked', () => {
      service
        .updateBlockedFeatures('acc', { upload: true, search: false } as unknown as BlockedFeatureFormValues)
        .subscribe();
      expect(patch).toHaveBeenCalledWith('/manage/@account/acc/blocking_status', {
        blocking_state: AccountBlockingState.MANAGER,
        blocked_features: ['upload'],
      });
    });

    it('should unblock the account when no feature is blocked', () => {
      service.updateBlockedFeatures('acc', { upload: false } as unknown as BlockedFeatureFormValues).subscribe();
      expect(patch).toHaveBeenCalledWith('/manage/@account/acc/blocking_status', {
        blocking_state: AccountBlockingState.UNBLOCKED,
        blocked_features: [],
      });
    });
  });
});
