import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, forkJoin } from 'rxjs';
import { switchMap, filter, take } from 'rxjs/operators';
import { UsersService, InviteKbData } from '@flaps/core';
import { SDKService, StateService } from '@flaps/auth';
import { KBRoles } from '@nuclia/core';

@Injectable({ providedIn: 'root' })
export class KnowledgeBoxUsersService {
  private _slugs = forkJoin([
    this.state.account.pipe(
      filter((account) => !!account),
      map((account) => account!.slug),
      take(1),
    ),
    this.sdk.currentKb.pipe(
      map((kb) => kb.slug!),
      take(1),
    ),
  ]);

  private _onUpdateUsers = new BehaviorSubject<void>(undefined);

  usersKb = this._onUpdateUsers.pipe(
    switchMap(() => this._slugs),
    switchMap(([accountSlug, kbSlug]) => this.users.getKbUsers(accountSlug, kbSlug)),
  );

  constructor(private sdk: SDKService, private users: UsersService, private state: StateService) {}

  updateUsers(): void {
    this._onUpdateUsers.next();
  }

  inviteUser(data: InviteKbData): Observable<void> {
    return this._slugs.pipe(switchMap(([accountSlug, kbSlug]) => this.users.inviteToKb(accountSlug, kbSlug, data)));
  }

  changeRole(id: string, role: KBRoles) {
    return this._slugs.pipe(
      switchMap(([accountSlug, kbSlug]) =>
        this.users.setKbUsers(accountSlug, kbSlug, {
          add: [{ id, role }],
          delete: [],
        }),
      ),
    );
  }

  deleteUser(id: string) {
    return this._slugs.pipe(
      switchMap(([accountSlug, kbSlug]) => this.users.setKbUsers(accountSlug, kbSlug, { delete: [id] })),
    );
  }
}
