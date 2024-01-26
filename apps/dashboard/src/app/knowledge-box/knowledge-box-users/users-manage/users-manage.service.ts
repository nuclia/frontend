import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { SDKService } from '@flaps/core';
import { InviteKbData, KBRoles } from '@nuclia/core';

@Injectable()
export class UsersManageService {
  private _onUpdateUsers = new BehaviorSubject<null>(null);

  usersKb = this._onUpdateUsers.pipe(
    switchMap(() =>
      forkJoin([this.sdk.currentKb.pipe(take(1)), this.sdk.currentAccount.pipe(take(1))]).pipe(
        switchMap(([kb, account]) => kb.getUsers(account.slug)),
      ),
    ),
    shareReplay(1),
  );

  invitesKb = this._onUpdateUsers.pipe(
    switchMap(() => this.sdk.currentKb.pipe(take(1))),
    switchMap((kb) => kb.getInvites()),
    map((invites) =>
      invites.map(
        (invite) => ({ ...invite, expires: invite.expires + 'Z' }), // Set timezone
      ),
    ),
    shareReplay(1),
  );

  constructor(private sdk: SDKService) {}

  updateUsers(): void {
    this._onUpdateUsers.next(null);
  }

  inviteUser(data: InviteKbData): Observable<void> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.inviteToKb(data)),
    );
  }

  changeRole(userId: string, role: KBRoles) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.updateUsers({ update: [{ id: userId, role }] })),
      tap(() => this.updateUsers()),
    );
  }

  deleteUser(userId: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.updateUsers({ delete: [userId] })),
      tap(() => this.updateUsers()),
    );
  }

  deleteInvite(email: string) {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.deleteInvite(email)),
      tap(() => this.updateUsers()),
    );
  }
}
