import { Component, inject, OnInit } from '@angular/core';
import { NotificationService } from '../notifications/notification.service';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
})
export class BaseComponent implements OnInit {
  private notificationService = inject(NotificationService);

  isNotificationPanelOpen = false;

  ngOnInit() {
    this.notificationService.startListening();
  }
}
