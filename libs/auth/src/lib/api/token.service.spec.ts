import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { APIService } from '../api.service';
import { BackendConfigurationService } from '../backend-config.service';

import { TokenService } from './token.service';

describe('TokenService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        { provide: BackendConfigurationService, useValue: { getConfig: () => {} } },
        { provide: APIService, useValue: { post: () => of() } },
      ],
    }),
  );

  it('should be created', () => {
    const service: TokenService = TestBed.get(TokenService);
    expect(service).toBeTruthy();
  });
});
