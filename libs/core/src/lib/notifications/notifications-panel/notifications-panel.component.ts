import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { map, Observable } from 'rxjs';
import { NotificationUI } from '../notification.model';
import { NotificationComponent } from '../notification/notification.component';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'stf-notifications-panel',
  imports: [CommonModule, TranslateModule, PaButtonModule, NotificationComponent],
  templateUrl: './notifications-panel.component.html',
  styleUrl: './notifications-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPanelComponent implements OnDestroy {
  private notificationsService = inject(NotificationService);

  @Input({ transform: booleanAttribute }) isOpen = false;
  @Output() close = new EventEmitter<void>();

  notifications: Observable<NotificationUI[]> = this.notificationsService.notifications;
  hasNotifications = this.notifications.pipe(map((notifications) => notifications.length > 0));

  deleteAll() {
    this.notificationsService.deleteAll();
  }

  onClose() {
    this.notificationsService.markAllAsRead();
    this.close.emit();
  }

  ngOnDestroy() {
    this.notificationsService.stopListening();
  }
}
