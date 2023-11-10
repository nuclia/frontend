import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, switchMap, tap } from 'rxjs/operators';
import { SDKService } from '@flaps/core';
import { InviteKbData, KBRoles } from '@nuclia/core';

@Injectable()
export class UsersManageService {
  private _onUpdateUsers = new BehaviorSubject<null>(null);

  usersKb = this._onUpdateUsers.pipe(
    switchMap(() => this.sdk.currentKb.pipe(switchMap((kb) => kb.getUsers()))),
    shareReplay(),
  );

  constructor(private sdk: SDKService) {}

  updateUsers(): void {
    this._onUpdateUsers.next(null);
  }

  inviteUser(data: InviteKbData): Observable<void> {
    return this.sdk.currentKb.pipe(switchMap((kb) => kb.inviteToKb(data)));
  }

  changeRole(userId: string, role: KBRoles) {
    return this.sdk.currentKb.pipe(
      switchMap((kb) => kb.updateUsers({ update: [{ id: userId, role }] })),
      tap(() => this.updateUsers()),
    );
  }

  deleteUser(userId: string) {
    return this.sdk.currentKb.pipe(
      switchMap((kb) => kb.updateUsers({ delete: [userId] })),
      tap(() => this.updateUsers()),
    );
  }
}
