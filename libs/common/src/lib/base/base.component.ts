import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NotificationService } from '@flaps/core';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class BaseComponent implements OnInit {
  private notificationService = inject(NotificationService);

  isNotificationPanelOpen = false;

  ngOnInit() {
    this.notificationService.startListening();
  }

  skipToMain(event: Event) {
    event.preventDefault();
    const main = document.getElementById('dashboard-main');
    main?.scrollIntoView({ behavior: 'smooth' });
    main?.focus();
  }
}
