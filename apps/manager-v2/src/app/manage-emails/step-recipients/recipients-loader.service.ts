import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { GlobalAccountService } from '../../manage-accounts/global-account.service';
import { CustomerSubscriptionType, UserSummary } from '../../manage-users/user.models';
import { UserService } from '../../manage-users/user.service';
import { RecipientFilter } from '../email.models';
import {
  filterBySubscription,
  mergeUsers,
  toSubscriptionsByAccount,
  USER_SEGMENTS,
  UserSegment,
} from './user-segments';

@Injectable({ providedIn: 'root' })
export class RecipientsLoaderService {
  private userService = inject(UserService);
  private accountService = inject(GlobalAccountService);

  // A user can match several segments through different accounts, so each segment is queried on its own
  load(role: RecipientFilter, segments: UserSegment[]): Observable<UserSummary[]> {
    const accountRole = role === 'ALL' ? undefined : role;
    const definitions = USER_SEGMENTS.filter((segment) => segments.includes(segment.id));
    if (definitions.length === 0) {
      return this.userService.getUsers(accountRole);
    }
    const subscriptions$: Observable<ReadonlyMap<string, CustomerSubscriptionType> | null> = definitions.some(
      (segment) => segment.subscriptionTypes,
    )
      ? this.fetchSubscriptions()
      : of(null);
    return subscriptions$.pipe(
      switchMap((subscriptions) =>
        forkJoin(
          definitions.map((segment) => {
            const { subscriptionTypes } = segment;
            if (!subscriptions || !subscriptionTypes) {
              return this.userService.getUsers(accountRole, segment.filters);
            }
            return this.userService
              .getUsers(accountRole, { ...segment.filters, includeAccounts: true })
              .pipe(map((users) => filterBySubscription(users, subscriptionTypes, subscriptions)));
          }),
        ),
      ),
      map(mergeUsers),
    );
  }

  // An empty list would make every account look like it has no subscription
  private fetchSubscriptions(): Observable<ReadonlyMap<string, CustomerSubscriptionType>> {
    return this.accountService.getSubscriptions().pipe(
      map((subscriptions) => {
        if (subscriptions.length === 0) {
          throw new Error('No subscriptions returned');
        }
        return toSubscriptionsByAccount(subscriptions);
      }),
    );
  }
}
