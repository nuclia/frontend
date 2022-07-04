import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DeprecatedApiService } from '../api';
import { BackendConfigurationService } from '../config';

import { TokenService } from './token.service';

describe('TokenService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        { provide: BackendConfigurationService, useValue: { getConfig: () => {} } },
        { provide: DeprecatedApiService, useValue: { post: () => of() } },
      ],
    }),
  );

  it('should be created', () => {
    const service: TokenService = TestBed.get(TokenService);
    expect(service).toBeTruthy();
  });
});
