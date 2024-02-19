import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, ReplaySubject } from 'rxjs';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { SDKService } from '@flaps/core';
import { InviteKbData, KBRoles, WritableKnowledgeBox } from '@nuclia/core';

@Injectable()
export class UsersManageService {
  private _onUpdateUsers = new BehaviorSubject<null>(null);
  private _kb = new ReplaySubject<WritableKnowledgeBox>();

  usersKb = this._onUpdateUsers.pipe(
    switchMap(() =>
      forkJoin([this._kb.pipe(take(1)), this.sdk.currentAccount.pipe(take(1))]).pipe(
        switchMap(([kb, account]) => kb.getUsers(account.slug)),
      ),
    ),
    shareReplay(1),
  );

  invitesKb = this._onUpdateUsers.pipe(
    switchMap(() => this._kb.pipe(take(1))),
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

  setKb(kb: WritableKnowledgeBox) {
    this._kb.next(kb);
    this.updateUsers();
  }

  inviteUser(data: InviteKbData): Observable<void> {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.inviteToKb(data)),
      tap(() => this.updateUsers()),
    );
  }

  addUser(id: string, role: KBRoles) {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.updateUsers({ add: [{ id, role }] })),
      tap(() => this.updateUsers()),
    );
  }

  changeRole(userId: string, role: KBRoles) {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.updateUsers({ update: [{ id: userId, role }] })),
      tap(() => this.updateUsers()),
    );
  }

  deleteUser(userId: string) {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.updateUsers({ delete: [userId] })),
      tap(() => this.updateUsers()),
    );
  }

  deleteInvite(email: string) {
    return this._kb.pipe(
      take(1),
      switchMap((kb) => kb.deleteInvite(email)),
      tap(() => this.updateUsers()),
    );
  }
}
