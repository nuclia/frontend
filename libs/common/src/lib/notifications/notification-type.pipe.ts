import { Pipe, PipeTransform } from '@angular/core';
import { NotificationType } from './notification.model';

@Pipe({
  name: 'notificationType',
  standalone: true,
})
export class NotificationTypePipe implements PipeTransform {
  transform(value: NotificationType, failure: boolean): string {
    switch (value) {
      case 'resource-processing':
        return failure ? 'notification.type.processing-failed' : 'notification.type.processing-completed';
    }
  }
}
