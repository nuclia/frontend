import { Component, inject, OnInit } from '@angular/core';
import { NotificationService } from '@flaps/core';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
  standalone: false,
})
export class BaseComponent implements OnInit {
  private notificationService = inject(NotificationService);

  isNotificationPanelOpen = false;

  ngOnInit() {
    this.notificationService.startListening();
  }
}
