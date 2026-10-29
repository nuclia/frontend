import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { UserService } from '@flaps/core';
import { MockProvider } from 'ng-mocks';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { canSendEmailsGuard } from './can-send-emails.guard';

describe('canSendEmailsGuard', () => {
  const userType = new BehaviorSubject<string | undefined>(undefined);
  const tree = {} as UrlTree;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(UserService, { userType } as unknown as UserService),
        MockProvider(Router, { createUrlTree: jest.fn().mockReturnValue(tree) }),
      ],
    });
  });

  const run = () =>
    firstValueFrom(
      TestBed.runInInjectionContext(() => canSendEmailsGuard({} as never, {} as never)) as Observable<
        boolean | UrlTree
      >,
    );

  it('should wait for the user type and allow ROOT', async () => {
    const result = run();
    userType.next('ROOT');
    expect(await result).toBe(true);
  });

  it('should redirect other user types', async () => {
    userType.next('MANAGER');
    expect(await run()).toBe(tree);
  });
});
