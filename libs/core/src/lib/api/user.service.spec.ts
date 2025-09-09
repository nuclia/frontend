import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SDKService } from './sdk.service';

import { RouterModule } from '@angular/router';
import { UserService } from './user.service';

describe('UserService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [RouterModule.forRoot([])],
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
