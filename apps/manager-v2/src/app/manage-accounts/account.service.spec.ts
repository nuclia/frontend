import { TestBed } from '@angular/core/testing';

import { AccountService } from './account.service';
import { MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockProvider(SDKService)],
    });
    service = TestBed.inject(AccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
