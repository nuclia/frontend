import { TestBed } from '@angular/core/testing';

import { UserService } from './user.service';
import { MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';

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
});
