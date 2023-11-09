import { TestBed } from '@angular/core/testing';
import { SDKService } from '../api';
import { BackendConfigurationService } from '../config';

import { TokenService } from './token.service';
import { MockProvider } from 'ng-mocks';

describe('TokenService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        { provide: BackendConfigurationService, useValue: { getConfig: () => {} } },
        MockProvider(SDKService),
      ],
    }),
  );

  it('should be created', () => {
    const service: TokenService = TestBed.inject(TokenService);
    expect(service).toBeTruthy();
  });
});
