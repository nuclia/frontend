import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SDKService } from './sdk.service';

import { UserService } from './user.service';

describe('UserService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SDKService,
          useValue: {
            nuclia: {
              auth: {
                logout: () => {},
                isAuthenticated: () => of(),
              },
              db: { getWelcome: () => of() },
            },
          },
        },
      ],
    }),
  );

  it('should be created', () => {
    const service: UserService = TestBed.get(UserService);
    expect(service).toBeTruthy();
  });
});
