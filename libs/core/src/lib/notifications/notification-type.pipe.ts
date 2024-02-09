import { Pipe, PipeTransform } from '@angular/core';
import { NotificationUI } from './notification.model';

@Pipe({
  name: 'notificationType',
  standalone: true,
})
export class NotificationTypePipe implements PipeTransform {
  transform(notification: NotificationUI): string {
    if (notification.type === 'resource' && notification.operation) {
      switch (notification.operation) {
        case 'created':
          return notification.failure ? 'notification.type.creation-failed' : 'notification.type.creation-completed';
        case 'modified':
          return notification.failure
            ? 'notification.type.modification-failed'
            : 'notification.type.modification-completed';
        case 'deleted':
          return notification.failure ? 'notification.type.deletion-failed' : 'notification.type.deletion-completed';
      }
    } else if (notification.type === 'sync-server' && notification.failure) {
      return 'notification.type.sync-server-down';
    } else {
      return '';
    }
  }
}
