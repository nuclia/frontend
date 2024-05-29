import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { NotificationData, NotificationUI } from './notification.model';
import { NavigationService } from '../services';
import { SDKService } from '../api';
import { differenceInSeconds } from 'date-fns';
import { WritableKnowledgeBox } from '@nuclia/core';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _currentKb?: WritableKnowledgeBox;
  private _notifications = new BehaviorSubject<NotificationUI[]>([]);
  private _hasNewResourceOperationNotifications = new Subject<boolean>();
  notifications: Observable<NotificationUI[]> = this._notifications.asObservable();
  hasNewResourceOperationNotifications = this._hasNewResourceOperationNotifications.asObservable();

  unreadNotificationsCount: Observable<number> = this.notifications.pipe(
    map((messages) => messages.filter((message) => message.unread).length),
  );

  constructor(
    private sdk: SDKService,
    private navigationService: NavigationService,
  ) {}

  startListening() {
    if (!this.sdk.nuclia.options.standalone) {
      combineLatest([this.sdk.currentAccount, this.sdk.currentKb])
        .pipe(
          tap(([, kb]) => {
            if (this._currentKb) {
              this.stopListening();
            }
            this._currentKb = kb;
          }),
          switchMap(([account, kb]) =>
            kb.listenToResourceOperationNotifications().pipe(
              tap((notifications) => {
                let existingNotifications = this._notifications.value;
                // most recent notifications are first in the list
                const lastNotification = existingNotifications[0];
                const newNotifications: NotificationUI[] = [];
                notifications.forEach((newNotif) => {
                  const resourceInfo: NotificationData = {
                    title: newNotif.resourceTitle,
                    resourceId: newNotif.resourceId,
                    resourceUrl: kb.slug
                      ? this.navigationService.getResourcePreviewUrl(account.slug, kb.slug, newNotif.resourceId)
                      : undefined,
                  };
                  // we group notifications happening within 30 seconds only for unread notification of the same operation type
                  if (
                    lastNotification &&
                    lastNotification.unread &&
                    lastNotification.operation === newNotif.operation &&
                    differenceInSeconds(new Date(newNotif.timestamp), new Date(lastNotification.timestamp)) <= 30 &&
                    newNotif.success === !lastNotification.failure
                  ) {
                    lastNotification.data = [resourceInfo].concat(lastNotification.data);
                    existingNotifications = [{ ...lastNotification }].concat(existingNotifications.slice(1));
                  } else {
                    newNotifications.push({
                      type: 'resource',
                      operation: newNotif.operation,
                      timestamp: newNotif.timestamp,
                      failure: !newNotif.success,
                      unread: true,
                      data: [resourceInfo],
                    });
                  }
                });
                this._notifications.next(newNotifications.concat(existingNotifications));
                if (notifications.length > 0) {
                  this._hasNewResourceOperationNotifications.next(true);
                }
              }),
            ),
          ),
          takeUntil(this.sdk.nuclia.auth.isAuthenticated().pipe(filter((isAuthenticated) => !isAuthenticated))),
        )
        .subscribe();
    }
  }

  pushNotifications(notifications: NotificationUI[]) {
    this._notifications.next(notifications.concat(this._notifications.value));
  }

  markAllAsRead() {
    this._notifications.next(this._notifications.value.map((message) => ({ ...message, unread: false })));
  }

  deleteAll() {
    this._notifications.next([]);
  }

  stopListening() {
    if (this._currentKb) {
      this._currentKb.stopListeningToNotifications();
      this._currentKb = undefined;
      this._notifications.next([]);
    }
  }
}
