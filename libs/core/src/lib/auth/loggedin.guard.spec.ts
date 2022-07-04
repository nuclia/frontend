import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';

import { LoggedinGuard } from './loggedin.guard';

describe('ExampleGuard', () => {
  let guard: LoggedinGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: { setNextParams: () => {}, setNextUrl: () => {} } }],
    });
    guard = TestBed.inject(LoggedinGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
