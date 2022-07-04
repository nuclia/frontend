import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { APIService } from '../api';
import { BackendConfigurationService } from '../config';

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
