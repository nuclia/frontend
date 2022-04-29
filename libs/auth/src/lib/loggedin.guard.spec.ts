import { TestBed, inject } from '@angular/core/testing';
import { SDKService } from './sdk.service';
import { AuthService } from './auth.service';

import { LoggedinGuard } from './loggedin.guard';

describe('LoggedinGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggedinGuard,
        {
          provide: SDKService,
          useValue: {
            nuclia: { auth: { getToken: () => 'token' } },
          },
        },
        { provide: AuthService, useValue: { setNextParams: () => {}, setNextUrl: () => {} } },
      ],
    });
  });

  it('should ...', inject([LoggedinGuard], (guard: LoggedinGuard) => {
    expect(guard).toBeTruthy();
  }));
});
