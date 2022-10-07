import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { SDKService } from './sdk.service';
import { AuthService } from '../auth/auth.service';

import { UserService } from './user.service';

describe('UserService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
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
        {
          provide: AuthService,
          useValue: {
            setNextParams: () => {},
            setNextUrl: () => {},
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
