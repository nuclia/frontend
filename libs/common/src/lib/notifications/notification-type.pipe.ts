import { Pipe, PipeTransform } from '@angular/core';
import { NotificationUI } from './notification.model';

@Pipe({
  name: 'notificationType',
  standalone: true,
})
export class NotificationTypePipe implements PipeTransform {
  transform(notification: NotificationUI, failure: boolean): string {
    if (notification.type !== 'resource') {
      return '';
    }
    switch (notification.operation) {
      case 'created':
        return failure ? 'notification.type.creation-failed' : 'notification.type.creation-completed';
      case 'modified':
        return failure ? 'notification.type.modification-failed' : 'notification.type.modification-completed';
      case 'deleted':
        return failure ? 'notification.type.deletion-failed' : 'notification.type.deletion-completed';
    }
  }
}
