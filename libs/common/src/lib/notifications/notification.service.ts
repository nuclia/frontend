import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, switchMap, take, tap } from 'rxjs';
import { NotificationData, NotificationUI } from './notification.model';
import { SDKService } from '@flaps/core';
import { NavigationService } from '../services';
import { differenceInSeconds } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _notifications = new BehaviorSubject<NotificationUI[]>([]);
  notifications: Observable<NotificationUI[]> = this._notifications.asObservable();

  unreadNotificationsCount: Observable<number> = this.notifications.pipe(
    map((messages) => messages.filter((message) => message.unread).length),
  );

  constructor(
    private sdk: SDKService,
    private navigationService: NavigationService,
  ) {
    combineLatest([this.sdk.currentAccount, this.sdk.currentKb])
      .pipe(
        switchMap(([account, kb]) =>
          kb.listenToProcessingNotifications().pipe(
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
                // we group notifications happening within 30 seconds only for unread notification
                if (
                  lastNotification &&
                  lastNotification.unread &&
                  differenceInSeconds(new Date(newNotif.timestamp), new Date(lastNotification.timestamp)) <= 30 &&
                  newNotif.success === !lastNotification.failure
                ) {
                  lastNotification.data = [resourceInfo].concat(lastNotification.data);
                  existingNotifications = [{ ...lastNotification }].concat(existingNotifications.slice(1));
                } else {
                  newNotifications.push({
                    type: 'resource-processing',
                    timestamp: newNotif.timestamp,
                    failure: !newNotif.success,
                    unread: true,
                    data: [resourceInfo],
                  });
                }
              });
              this._notifications.next(newNotifications.concat(existingNotifications));
            }),
          ),
        ),
      )
      .subscribe();
  }

  markAllAsRead() {
    this._notifications.next(this._notifications.value.map((message) => ({ ...message, unread: false })));
  }

  deleteAll() {
    this._notifications.next([]);
  }

  stopListening() {
    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => kb.stopListeningToNotifications());
  }
}
