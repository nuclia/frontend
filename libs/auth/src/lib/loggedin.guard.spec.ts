import { TestBed, inject, waitForAsync } from '@angular/core/testing';

import { LoggedinGuard } from './loggedin.guard';

describe('LoggedinGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggedinGuard],
    });
  });

  it('should ...', inject([LoggedinGuard], (guard: LoggedinGuard) => {
    expect(guard).toBeTruthy();
  }));
});
