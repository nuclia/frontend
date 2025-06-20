import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SDKService } from './sdk.service';

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
                isAuthenticated: () => of(null),
              },
              db: { getWelcome: () => of(null) },
              options: { standalone: false },
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
    const service: UserService = TestBed.inject(UserService);
    expect(service).toBeTruthy();
  });
});
