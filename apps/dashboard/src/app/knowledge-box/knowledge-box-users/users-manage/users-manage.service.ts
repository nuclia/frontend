import { Injectable } from '@angular/core';
import { map, Observable, ReplaySubject } from 'rxjs';
import { shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { InviteKbData, SDKService, UsersService } from '@flaps/core';
import { KBRoles } from '@nuclia/core';

@Injectable()
export class UsersManageService {
  private accountSlug = this.sdk.currentAccount.pipe(
    map((account) => account.slug),
    take(1),
  );

  private _onUpdateUsers = new ReplaySubject<string>();

  usersKb = this._onUpdateUsers.pipe(
    switchMap((kbSlug: string) =>
      this.accountSlug.pipe(switchMap((accountSlug) => this.users.getKbUsers(accountSlug, kbSlug))),
    ),
    shareReplay(),
  );

  constructor(
    private users: UsersService,
    private sdk: SDKService,
  ) {}

  updateUsers(kbSlug: string): void {
    this._onUpdateUsers.next(kbSlug);
  }

  inviteUser(kbSlug: string, data: InviteKbData): Observable<void> {
    return this.accountSlug.pipe(switchMap((accountSlug) => this.users.inviteToKb(accountSlug, kbSlug, data)));
  }

  changeRole(kbSlug: string, id: string, role: KBRoles) {
    return this.accountSlug.pipe(
      switchMap((accountSlug) =>
        this.users.setKbUsers(accountSlug, kbSlug, {
          update: [{ id, role }],
        }),
      ),
      tap(() => {
        this.updateUsers(kbSlug);
      }),
    );
  }

  deleteUser(kbSlug: string, id: string) {
    return this.accountSlug.pipe(
      switchMap((accountSlug) => this.users.setKbUsers(accountSlug, kbSlug, { delete: [id] })),
      tap(() => {
        this.updateUsers(kbSlug);
      }),
    );
  }
}
